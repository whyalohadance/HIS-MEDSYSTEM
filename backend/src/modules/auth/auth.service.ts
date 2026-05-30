import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-log.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private auditService: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
    });

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      accessToken: token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });

    if (!user) {
      this.auditService.log({
        action: AuditAction.LOGIN_FAILED,
        resource: 'auth',
        method: 'POST',
        endpoint: '/api/auth/login',
        success: false,
        description: `Failed login: unknown email`,
      }).catch(() => {});
      throw new UnauthorizedException('Credențiale invalide');
    }

    // Проверка блокировки
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException({
        message: 'Cont blocat temporar',
        lockedUntil: user.lockedUntil.toISOString(),
        code: 'ACCOUNT_LOCKED',
      });
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await this.usersRepo.save(user);
      this.auditService.log({
        userId: user.id,
        action: AuditAction.LOGIN_FAILED,
        resource: 'auth',
        method: 'POST',
        endpoint: '/api/auth/login',
        success: false,
        description: `Failed login attempt for ${user.email}`,
      }).catch(() => {});
      throw new UnauthorizedException('Credențiale invalide');
    }

    // Успешный вход — сбрасываем счётчик
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      await this.usersRepo.save(user);
    }

    this.auditService.log({
      userId: user.id,
      action: AuditAction.LOGIN,
      resource: 'auth',
      method: 'POST',
      endpoint: '/api/auth/login',
      success: true,
      description: `User ${user.email} logged in`,
    }).catch(() => {});

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        createdAt: user.createdAt,
      },
      accessToken: token,
    };
  }

  private generateToken(id: number, email: string, role: string): string {
    return this.jwtService.sign({ sub: id, email, role });
  }
}
