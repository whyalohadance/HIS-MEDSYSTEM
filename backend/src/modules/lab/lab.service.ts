import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabTest } from './lab-test.entity';
import { LabOrder, OrderStatus } from './lab-order.entity';
import { LabResult, ResultFlag } from './lab-result.entity';

@Injectable()
export class LabService {
  constructor(
    @InjectRepository(LabTest)
    private testRepo: Repository<LabTest>,
    @InjectRepository(LabOrder)
    private orderRepo: Repository<LabOrder>,
    @InjectRepository(LabResult)
    private resultRepo: Repository<LabResult>
  ) {}

  private generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `LAB-${year}${month}${day}-${random}`;
  }

  // Tests catalog
  async findAllTests(): Promise<LabTest[]> {
    return this.testRepo.find({
      where: { isActive: true },
      order: { category: 'ASC', name: 'ASC' }
    });
  }

  async createTest(dto: any): Promise<LabTest> {
    const test = this.testRepo.create(dto);
    const saved: any = await this.testRepo.save(test);
    return saved;
  }

  // Orders
  async findAllOrders(filters?: any): Promise<LabOrder[]> {
    const query = this.orderRepo.createQueryBuilder('order')
      .orderBy('order.createdAt', 'DESC');

    if (filters?.patientId) {
      query.andWhere('order.patientId = :patientId', { patientId: filters.patientId });
    }
    if (filters?.doctorId) {
      query.andWhere('order.doctorId = :doctorId', { doctorId: filters.doctorId });
    }
    if (filters?.status) {
      query.andWhere('order.status = :status', { status: filters.status });
    }

    return query.getMany();
  }

  async findOrder(id: number): Promise<LabOrder> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Заказ не найден');
    return order;
  }

  async findByPatient(patientId: number): Promise<LabOrder[]> {
    return this.orderRepo.find({
      where: { patientId },
      order: { createdAt: 'DESC' }
    });
  }

  async findWorklist(): Promise<LabOrder[]> {
    return this.orderRepo.find({
      where: [
        { status: OrderStatus.PENDING },
        { status: OrderStatus.IN_PROGRESS }
      ],
      order: { priority: 'ASC', scheduledAt: 'ASC' }
    });
  }

  async createOrder(doctorId: number, dto: any): Promise<LabOrder> {
    const order = this.orderRepo.create({
      ...dto,
      doctorId,
      orderNumber: this.generateOrderNumber(),
      status: OrderStatus.PENDING
    });
    const saved: any = await this.orderRepo.save(order);
    return saved;
  }

  async updateOrder(id: number, dto: any): Promise<LabOrder> {
    if (dto.status === OrderStatus.COMPLETED && !dto.completedAt) {
      dto.completedAt = new Date().toISOString();
    }
    await this.orderRepo.update(id, dto);
    return this.findOrder(id);
  }

  async deleteOrder(id: number): Promise<void> {
    await this.resultRepo.delete({ orderId: id });
    await this.orderRepo.delete(id);
  }

  // Results
  async findResults(orderId: number): Promise<LabResult[]> {
    return this.resultRepo.find({
      where: { orderId },
      order: { id: 'ASC' }
    });
  }

  private calculateFlag(value: number, min: number, max: number): ResultFlag {
    if (!min || !max) return ResultFlag.NORMAL;
    const range = max - min;
    const criticalLow = min - range * 0.3;
    const criticalHigh = max + range * 0.3;

    if (value < criticalLow) return ResultFlag.CRITICAL_LOW;
    if (value > criticalHigh) return ResultFlag.CRITICAL_HIGH;
    if (value < min) return ResultFlag.LOW;
    if (value > max) return ResultFlag.HIGH;
    return ResultFlag.NORMAL;
  }

  async saveResults(orderId: number, labTechnicianId: number, results: any[]): Promise<LabResult[]> {
    await this.resultRepo.delete({ orderId });

    const saved: LabResult[] = [];
    for (const r of results) {
      const numericValue = parseFloat(r.value);
      let flag = ResultFlag.NORMAL;

      if (!isNaN(numericValue) && r.minRange && r.maxRange) {
        flag = this.calculateFlag(numericValue, r.minRange, r.maxRange);
      }

      const result = this.resultRepo.create({
        orderId,
        parameterName: r.parameterName,
        value: r.value,
        unit: r.unit,
        referenceRange: r.referenceRange,
        numericValue: isNaN(numericValue) ? undefined : numericValue,
        minRange: r.minRange,
        maxRange: r.maxRange,
        flag,
        comment: r.comment
      });
      saved.push(await this.resultRepo.save(result) as LabResult);
    }

    // Update order
    await this.orderRepo.update(orderId, {
      status: OrderStatus.COMPLETED,
      labTechnicianId,
      completedAt: new Date().toISOString()
    });

    return saved;
  }

  async getStats(): Promise<any> {
    const total = await this.orderRepo.count();
    const pending = await this.orderRepo.count({ where: { status: OrderStatus.PENDING } });
    const inProgress = await this.orderRepo.count({ where: { status: OrderStatus.IN_PROGRESS } });
    const completed = await this.orderRepo.count({ where: { status: OrderStatus.COMPLETED } });
    return { total, pending, inProgress, completed };
  }
}
