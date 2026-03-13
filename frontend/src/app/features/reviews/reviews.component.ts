import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReviewsService } from '../../core/services/reviews.service';
import { Review } from '../../core/models/review.model';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss']
})
export class ReviewsComponent implements OnInit {
  reviews: Review[] = [];
  averageRating = 0;
  isLoading = true;

  constructor(
    private service: ReviewsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadReviews();
    this.loadAverageRating();
  }

  loadReviews(): void {
    this.service.getAll().subscribe({
      next: data => {
        this.reviews = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadAverageRating(): void {
    this.service.getAverageRating().subscribe({
      next: data => {
        this.averageRating = data;
        this.cdr.detectChanges();
      }
    });
  }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }

  getInitials(patientId: number): string {
    return `П${patientId}`;
  }
}
