import { FormEvent, useEffect, useState } from 'react';
import { CalendarDays, CheckCircle, ChevronDown, ChevronUp, Clock, MapPin, Star } from 'lucide-react';
import { BookingChat } from '@/app/components/BookingChat';
import { Booking } from '@/app/data/mockData';
import { useAuth } from '@/app/contexts/AuthContext';
import { appConfig } from '@/app/config/appConfig';
import {
  type BookingProgress,
  formatBookingStatus,
  getBookingCompletionPercent,
  getBookingProgress,
} from '@/app/utils/bookingStorage';
import { formatDistance } from '@/app/utils/geoUtils';
import { localApi } from '@/app/utils/localApi';

interface CustomerBookingCardProps {
  booking: Booking;
  onBookingUpdated?: () => void;
  onReviewCreated?: () => void;
}

function formatLocation(location?: { latitude: number; longitude: number; capturedAt: string }) {
  if (!location) {
    return 'Chưa ghi nhận';
  }

  return `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
}

function formatLocationDistance(location?: { distanceMeters?: number; withinAllowedRadius?: boolean }) {
  if (typeof location?.distanceMeters !== 'number') {
    return 'Chưa kiểm tra khoảng cách';
  }

  return `${formatDistance(location.distanceMeters)} - ${location.withinAllowedRadius ? 'hợp lệ' : 'cần kiểm tra lại'}`;
}

export function CustomerBookingCard({ booking, onBookingUpdated, onReviewCreated }: CustomerBookingCardProps) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [progress, setProgress] = useState<BookingProgress>(() => getBookingProgress(booking.id));

  const completionPercent = getBookingCompletionPercent(progress);
  const canCancel = booking.status === 'pending';
  const canReview = booking.status === 'completed' && !reviewed;
  const canPay = booking.status === 'completed' && booking.paymentStatus !== 'paid';
  const canUsePaymentAction = canPay && (appConfig.runtimeMode === 'local' || appConfig.capabilities.realPayments);

  useEffect(() => {
    let active = true;
    Promise.all([
      localApi.bookings.getProgress(booking.id),
      localApi.reviews.hasCustomerReviewedBooking(booking.id),
    ]).then(([nextProgress, hasReviewed]) => {
      if (active) {
        setProgress(nextProgress);
        setReviewed(hasReviewed);
      }
    });

    return () => {
      active = false;
    };
  }, [booking.id]);

  const handleCancel = async () => {
    await localApi.bookings.updateStatus(booking.id, 'cancelled');
    if (booking.helperId) {
      await localApi.notifications.create({
        userId: booking.helperId,
        title: 'Khách đã hủy lịch',
        message: `${booking.service} vào ${new Date(booking.date).toLocaleDateString('vi-VN')} đã bị hủy.`,
      });
    }
    onBookingUpdated?.();
  };

  const handlePayment = async () => {
    await localApi.bookings.updatePaymentStatus(booking.id, 'paid');
    await localApi.notifications.create({
      userId: booking.customerId,
      title: 'Thanh toán thành công',
      message: `Bạn đã thanh toán ${booking.totalPrice.toLocaleString('vi-VN')} đ cho lịch ${booking.service}.`,
    });
    if (booking.helperId) {
      await localApi.notifications.create({
        userId: booking.helperId,
        title: 'Khách đã thanh toán',
        message: `Lịch ${booking.service} đã được thanh toán ${booking.totalPrice.toLocaleString('vi-VN')} đ.`,
      });
    }
    onBookingUpdated?.();
  };

  const handleReviewSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await localApi.reviews.createCustomerReview(booking.id, {
      helperId: booking.helperId,
      customerId: user?.id ?? booking.customerId,
      customerName: user?.name ?? 'Khách hàng',
      rating,
      comment: comment.trim() || 'Dịch vụ tốt.',
      service: booking.service,
      images: progress.photoConfirmation?.dataUrl ? [progress.photoConfirmation.dataUrl] : undefined,
    });
    setReviewed(true);
    setComment('');
    onReviewCreated?.();
  };

  return (
    <div className="bg-[#F0F4F8] rounded-2xl p-4 border border-[#E2E8F0]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold text-[#1A365D] text-sm">{booking.service}</h3>
          <p className="text-xs text-gray-600 mt-1">{booking.helperName}</p>
        </div>
        <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-semibold whitespace-nowrap">
          {formatBookingStatus(booking.status)}
        </span>
      </div>

      <div className="flex justify-between text-xs text-gray-600 bg-white/70 rounded-xl px-3 py-2 mb-3">
        <span>Thanh toán</span>
        <span className={booking.paymentStatus === 'paid' ? 'text-green-700 font-semibold' : 'text-yellow-700 font-semibold'}>
          {booking.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-[#6366F1]" />
          <span>{new Date(booking.date).toLocaleDateString('vi-VN')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#6366F1]" />
          <span>{booking.time} - {booking.hours} giờ</span>
        </div>
        <div className="col-span-2 flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#6366F1] mt-0.5 flex-shrink-0" />
          <span>{booking.address}</span>
        </div>
      </div>

      <div className="mt-3 border-t border-[#E2E8F0] pt-3">
        <div className="flex justify-between text-[11px] text-gray-600 mb-2">
          <span>Checklist: {completionPercent}%</span>
          <span>{progress.checkIn ? 'Đã check-in GPS' : 'Chưa check-in'}</span>
        </div>
        <div className="h-2 bg-white rounded-full overflow-hidden">
          <div className="h-full bg-[#6366F1]" style={{ width: `${completionPercent}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="px-3 py-2 bg-white text-[#6366F1] border border-[#6366F1] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Chi tiết
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={!canCancel}
          className="px-3 py-2 bg-red-50 disabled:bg-gray-100 text-red-600 disabled:text-gray-400 border border-red-200 disabled:border-gray-200 rounded-xl text-xs font-semibold"
        >
          Hủy lịch
        </button>
      </div>

      {canPay && (
        <button
          type="button"
          onClick={handlePayment}
          disabled={!canUsePaymentAction}
          className="w-full mt-2 px-3 py-2 bg-green-600 disabled:bg-gray-300 text-white rounded-xl text-xs font-semibold"
        >
          {canUsePaymentAction
            ? `${appConfig.capabilities.realPayments ? 'Thanh toán' : 'Thanh toán local'} ${booking.totalPrice.toLocaleString('vi-VN')} đ`
            : 'Chưa cấu hình cổng thanh toán'}
        </button>
      )}

      {expanded && (
        <div className="mt-4 space-y-4">
          <div className="bg-white rounded-xl p-3">
            <h4 className="font-semibold text-[#1A365D] text-sm mb-2">Checklist công việc</h4>
            <div className="space-y-2">
              {progress.checklist.map((item) => (
                <div key={item.id} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${item.completed ? 'text-green-600' : 'text-gray-300'}`} />
                  <span className={item.completed ? 'line-through text-gray-400' : ''}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 text-xs text-gray-600 space-y-2">
            <h4 className="font-semibold text-[#1A365D] text-sm">GPS</h4>
            <p>Check-in: {formatLocation(progress.checkIn)}</p>
            {progress.checkIn && <p>Khoảng cách check-in: {formatLocationDistance(progress.checkIn)}</p>}
            <p>Check-out: {formatLocation(progress.checkOut)}</p>
            {progress.checkOut && <p>Khoảng cách check-out: {formatLocationDistance(progress.checkOut)}</p>}
          </div>

          <BookingChat booking={booking} />

          {progress.photoConfirmation?.dataUrl && (
            <div className="bg-white rounded-xl p-3">
              <h4 className="font-semibold text-[#1A365D] text-sm mb-2">Ảnh xác nhận</h4>
              <img
                src={progress.photoConfirmation.dataUrl}
                alt="Ảnh xác nhận kết quả"
                className="w-full h-44 object-cover rounded-xl"
              />
            </div>
          )}

          {reviewed && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
              Bạn đã đánh giá lịch này.
            </div>
          )}

          {canReview && (
            <form onSubmit={handleReviewSubmit} className="bg-white rounded-xl p-3 space-y-3">
              <h4 className="font-semibold text-[#1A365D] text-sm">Đánh giá dịch vụ</h4>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    <Star className={`w-5 h-5 ${star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Nhận xét của bạn..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
              />
              <button
                type="submit"
                className="w-full px-3 py-2 bg-[#6366F1] text-white rounded-xl text-sm font-semibold"
              >
                Gửi đánh giá
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
