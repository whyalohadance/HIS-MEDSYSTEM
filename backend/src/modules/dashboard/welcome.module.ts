import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WelcomeController } from './welcome.controller';
import { WelcomeService } from './welcome.service';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [WelcomeController],
  providers: [WelcomeService]
})
export class WelcomeModule {}
