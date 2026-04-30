import { Review, mockReviews } from '@/app/data/mockData';

const REVIEWS_STORAGE_KEY = 'hometask_reviews';

export type ReviewInput = Omit<Review, 'id' | 'date'>;

function readStoredReviews(): Review[] {
  const rawReviews = localStorage.getItem(REVIEWS_STORAGE_KEY);
  if (!rawReviews) {
    return [];
  }

  try {
    const parsedReviews = JSON.parse(rawReviews);
    return Array.isArray(parsedReviews) ? parsedReviews : [];
  } catch {
    localStorage.removeItem(REVIEWS_STORAGE_KEY);
    return [];
  }
}

function writeStoredReviews(reviews: Review[]) {
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
}

export function getAllReviews() {
  return [...readStoredReviews(), ...mockReviews];
}

export function getReviewsForHelper(helperId: string) {
  return getAllReviews()
    .filter((review) => review.helperId === helperId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getHelperRatingStats(helperId: string) {
  const reviews = getReviewsForHelper(helperId);
  if (reviews.length === 0) {
    return {
      rating: 0,
      reviewsCount: 0,
    };
  }

  const averageRating = reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;

  return {
    rating: Number(averageRating.toFixed(1)),
    reviewsCount: reviews.length,
  };
}

export function hasCustomerReviewedBooking(bookingId: string) {
  return readStoredReviews().some((review) => review.id === `review_${bookingId}`);
}

export function createCustomerReview(bookingId: string, input: ReviewInput) {
  const review: Review = {
    ...input,
    id: `review_${bookingId}`,
    date: new Date().toISOString(),
  };

  const existingReviews = readStoredReviews().filter((item) => item.id !== review.id);
  writeStoredReviews([review, ...existingReviews]);
  return review;
}
