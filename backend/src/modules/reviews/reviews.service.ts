import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private repo: Repository<Review>,
  ) {}

  async findAll(doctorId: number): Promise<Review[]> {
    return this.repo.find({ where: { doctorId }, order: { createdAt: 'DESC' } });
  }

  async create(dto: CreateReviewDto, doctorId: number): Promise<Review> {
    const review = this.repo.create({ ...dto, doctorId });
    return this.repo.save(review);
  }

  async getAverageRating(doctorId: number): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where('review.doctorId = :doctorId', { doctorId })
      .getRawOne();
    return parseFloat(result.avg) || 0;
  }
}
