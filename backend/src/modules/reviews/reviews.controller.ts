import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private service: ReviewsService) {}

  @Get()
  findAll(@Request() req) {
    return this.service.findAll(req.user.id);
  }

  @Get('average-rating')
  getAverageRating(@Request() req) {
    return this.service.getAverageRating(req.user.id);
  }

  @Post()
  create(@Body() dto: CreateReviewDto, @Request() req) {
    return this.service.create(dto, req.user.id);
  }
}
