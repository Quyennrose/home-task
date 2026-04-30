import { Booking, HelperProfile, Review, mockHelpers } from '@/app/data/mockData';
import { isBackendConfigured } from '@/app/config/appConfig';
import { apiRequest } from '@/app/services/apiClient';
import {
  getBookingProgress,
  createBooking,
  getAllStoredBookings,
  getBookingsByCustomerId,
  getBookingsByHelperId,
  updateBookingPaymentStatus,
  updateBookingProgress,
  updateBookingStatus,
  type BookingInput,
} from '@/app/utils/bookingStorage';
import {
  getHelperApplications,
  saveHelperApplication,
  updateHelperApplicationStatus,
} from '@/app/utils/helperApplicationStorage';
import {
  createNotification,
  getNotificationsByUserId,
  markNotificationsRead,
} from '@/app/utils/notificationStorage';
import {
  createCustomerReview,
  getHelperRatingStats,
  getReviewsForHelper,
  hasCustomerReviewedBooking,
  ReviewInput,
} from '@/app/utils/reviewStorage';
import {
  createBookingChatMessage,
  getBookingChatMessages,
  type BookingChatMessage,
} from '@/app/utils/bookingChatStorage';
import type { BookingProgress } from '@/app/utils/bookingStorage';
import type { AppNotification } from '@/app/utils/notificationStorage';

type NotificationInput = Omit<AppNotification, 'id' | 'createdAt' | 'read'>;
type ChatMessageInput = Omit<BookingChatMessage, 'id' | 'createdAt'>;

export interface AuditLog {
  id: string;
  actorId: string;
  actorType: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export const localApi = {
  helpers: {
    list: () => (
      isBackendConfigured
        ? apiRequest<HelperProfile[]>('/helpers')
        : Promise.resolve(mockHelpers)
    ),
    updateMe: (input: Partial<HelperProfile>) => (
      isBackendConfigured
        ? apiRequest<HelperProfile>('/me', { method: 'PATCH', body: JSON.stringify(input) })
        : Promise.resolve(input as HelperProfile)
    ),
  },
  bookings: {
    create: (input: BookingInput) => (
      isBackendConfigured
        ? apiRequest<Booking>('/bookings', { method: 'POST', body: JSON.stringify(input) })
        : Promise.resolve(createBooking(input))
    ),
    listAll: () => (
      isBackendConfigured
        ? apiRequest<Booking[]>('/admin/bookings')
        : Promise.resolve(getAllStoredBookings())
    ),
    listByCustomer: (customerId?: string) => (
      isBackendConfigured
        ? apiRequest<Booking[]>(`/bookings?customerId=${encodeURIComponent(customerId ?? '')}`)
        : Promise.resolve(getBookingsByCustomerId(customerId))
    ),
    listByHelper: (helperId?: string) => (
      isBackendConfigured
        ? apiRequest<Booking[]>(`/bookings?helperId=${encodeURIComponent(helperId ?? '')}`)
        : Promise.resolve(getBookingsByHelperId(helperId))
    ),
    getProgress: (bookingId: string) => (
      isBackendConfigured
        ? apiRequest<BookingProgress>(`/bookings/${bookingId}/progress`)
        : Promise.resolve(getBookingProgress(bookingId))
    ),
    updateStatus: (bookingId: string, status: Booking['status']) => {
      if (isBackendConfigured) {
        return apiRequest<Booking>(`/bookings/${bookingId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
      }

      updateBookingStatus(bookingId, status);
      return Promise.resolve(undefined);
    },
    updatePaymentStatus: (bookingId: string, paymentStatus: Booking['paymentStatus']) => {
      if (isBackendConfigured) {
        return apiRequest<Booking>(`/bookings/${bookingId}/payment`, {
          method: 'PATCH',
          body: JSON.stringify({ paymentStatus }),
        });
      }

      updateBookingPaymentStatus(bookingId, paymentStatus);
      return Promise.resolve(undefined);
    },
    updateProgress: (bookingId: string, update: (progress: BookingProgress) => BookingProgress) => {
      if (!isBackendConfigured) {
        return Promise.resolve(updateBookingProgress(bookingId, update));
      }

      return localApi.bookings.getProgress(bookingId).then((progress) => (
        apiRequest<BookingProgress>(`/bookings/${bookingId}/progress`, {
          method: 'PATCH',
          body: JSON.stringify(update(progress)),
        })
      ));
    },
  },
  helperApplications: {
    list: () => (
      isBackendConfigured
        ? apiRequest<HelperProfile[]>('/admin/helper-applications')
        : Promise.resolve(getHelperApplications())
    ),
    save: (application: HelperProfile) => {
      saveHelperApplication(application);
      return Promise.resolve(application);
    },
    updateStatus: (helperId: string, status: HelperProfile['applicationStatus']) => {
      if (isBackendConfigured) {
        return apiRequest<HelperProfile>(`/admin/helper-applications/${helperId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ applicationStatus: status }),
        });
      }

      updateHelperApplicationStatus(helperId, status);
      return Promise.resolve(undefined);
    },
  },
  notifications: {
    create: (input: NotificationInput) => (
      isBackendConfigured
        ? apiRequest<AppNotification>('/notifications', { method: 'POST', body: JSON.stringify(input) })
        : Promise.resolve(createNotification(input))
    ),
    listByUser: (userId?: string) => (
      isBackendConfigured
        ? apiRequest<AppNotification[]>('/notifications')
        : Promise.resolve(getNotificationsByUserId(userId))
    ),
    markRead: (userId?: string) => {
      if (isBackendConfigured) {
        return apiRequest<{ ok: boolean }>('/notifications/read', { method: 'PATCH', body: JSON.stringify({}) });
      }

      markNotificationsRead(userId);
      return Promise.resolve(undefined);
    },
  },
  reviews: {
    createCustomerReview: (bookingId: string, input: ReviewInput) => (
      isBackendConfigured
        ? apiRequest('/reviews', { method: 'POST', body: JSON.stringify({ ...input, bookingId }) })
        : Promise.resolve(createCustomerReview(bookingId, input))
    ),
    hasCustomerReviewedBooking: (bookingId: string) => (
      isBackendConfigured
        ? apiRequest<{ reviewed: boolean }>(`/reviews?bookingId=${encodeURIComponent(bookingId)}`).then((result) => result.reviewed)
        : Promise.resolve(hasCustomerReviewedBooking(bookingId))
    ),
    getForHelper: (helperId: string) => (
      isBackendConfigured
        ? apiRequest<{ reviews: Review[]; stats: { rating: number; reviewsCount: number } }>(`/helpers/${helperId}/reviews`)
          .then((result) => result.reviews)
        : Promise.resolve(getReviewsForHelper(helperId))
    ),
    getHelperRatingStats: (helperId: string) => (
      isBackendConfigured
        ? apiRequest<{ reviews: Review[]; stats: { rating: number; reviewsCount: number } }>(`/helpers/${helperId}/reviews`)
          .then((result) => result.stats)
        : Promise.resolve(getHelperRatingStats(helperId))
    ),
  },
  chat: {
    listByBooking: (bookingId: string) => (
      isBackendConfigured
        ? apiRequest<BookingChatMessage[]>(`/bookings/${bookingId}/messages`)
        : Promise.resolve(getBookingChatMessages(bookingId))
    ),
    create: (input: ChatMessageInput) => (
      isBackendConfigured
        ? apiRequest<BookingChatMessage>(`/bookings/${input.bookingId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ message: input.message }),
        })
        : Promise.resolve(createBookingChatMessage(input))
    ),
  },
  admin: {
    listAuditLogs: (params: { action?: string; limit?: number } = {}) => {
      if (!isBackendConfigured) {
        return Promise.resolve([] as AuditLog[]);
      }

      const searchParams = new URLSearchParams();
      if (params.action) searchParams.set('action', params.action);
      if (params.limit) searchParams.set('limit', String(params.limit));
      const query = searchParams.toString();
      return apiRequest<AuditLog[]>(`/admin/audit-logs${query ? `?${query}` : ''}`);
    },
  },
};
