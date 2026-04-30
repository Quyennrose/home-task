import { useEffect, useState } from 'react';
import { CalendarDays, ShieldAlert } from 'lucide-react';
import { BookingChat } from '@/app/components/BookingChat';
import { Booking } from '@/app/data/mockData';
import { getApiErrorMessage } from '@/app/services/apiClient';
import { formatBookingStatus, getBookingCompletionPercent, type BookingProgress } from '@/app/utils/bookingStorage';
import { formatDistance } from '@/app/utils/geoUtils';
import { localApi } from '@/app/utils/localApi';

type BookingFilter = 'all' | Booking['status'];

const bookingFilterOptions: { value: BookingFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã nhận' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];

function formatGeoDistance(distanceMeters?: number, withinAllowedRadius?: boolean) {
  if (typeof distanceMeters !== 'number') {
    return 'Chưa có GPS';
  }

  return `${formatDistance(distanceMeters)} - ${withinAllowedRadius ? 'hợp lệ' : 'cần kiểm tra'}`;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [progressByBookingId, setProgressByBookingId] = useState<Record<string, BookingProgress>>({});
  const [filter, setFilter] = useState<BookingFilter>('all');
  const [expandedBookingId, setExpandedBookingId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshBookings = () => {
    setLoading(true);
    setError('');
    localApi.bookings.listAll().then((nextBookings) => {
      setBookings(nextBookings);
      return Promise.all(nextBookings.map((booking) => localApi.bookings.getProgress(booking.id))).then((progressList) => {
        setProgressByBookingId(Object.fromEntries(progressList.map((progress) => [progress.bookingId, progress])));
      });
    }).catch((nextError) => {
      setError(getApiErrorMessage(nextError));
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    refreshBookings();
  }, []);

  const filteredBookings = bookings.filter((booking) => (
    filter === 'all' || booking.status === filter
  ));

  return (
    <section className="py-6 px-4 bg-white min-h-full">
      <div className="mb-5">
        <div className="inline-flex items-center gap-2 bg-[#6366F1]/10 text-[#6366F1] px-3 py-1.5 rounded-full text-xs font-medium mb-3">
          <ShieldAlert className="w-3 h-3" />
          Vận hành
        </div>
        <h1 className="text-2xl font-bold text-[#1A365D] mb-2">Quản lý lịch đặt</h1>
        <p className="text-gray-600 text-sm">
          Theo dõi lịch, tiến độ checklist, GPS, thanh toán và trao đổi khi cần hỗ trợ.
        </p>
      </div>

      <select
        value={filter}
        onChange={(event) => setFilter(event.target.value as BookingFilter)}
        className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1] mb-4"
      >
        {bookingFilterOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-[#F0F4F8] rounded-2xl p-5 text-center">
          <p className="text-gray-600 text-sm">Dang tai lich dat...</p>
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const progress = progressByBookingId[booking.id];
            if (!progress) {
              return null;
            }
            const completionPercent = getBookingCompletionPercent(progress);
            const isExpanded = expandedBookingId === booking.id;

            return (
              <div key={booking.id} className="bg-[#F0F4F8] rounded-2xl p-4 border border-[#E2E8F0]">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-semibold text-[#1A365D] text-sm">{booking.service}</h3>
                    <p className="text-xs text-gray-600 mt-1">{booking.helperName || 'Chưa chọn nhân viên'}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-semibold whitespace-nowrap">
                    {formatBookingStatus(booking.status)}
                  </span>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <p><CalendarDays className="w-3 h-3 inline mr-1" />{new Date(booking.date).toLocaleDateString('vi-VN')} lúc {booking.time} - {booking.hours} giờ</p>
                  <p>{booking.address}</p>
                  <p>Thanh toán: {booking.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>
                  <p>Checklist: {completionPercent}%</p>
                  <p>GPS check-in: {formatGeoDistance(progress.checkIn?.distanceMeters, progress.checkIn?.withinAllowedRadius)}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedBookingId(isExpanded ? '' : booking.id)}
                  className="w-full mt-3 px-3 py-2 bg-white text-[#6366F1] border border-[#6366F1] rounded-xl text-xs font-semibold"
                >
                  {isExpanded ? 'Ẩn chi tiết' : 'Xem chi tiết vận hành'}
                </button>

                {isExpanded && (
                  <div className="mt-4 space-y-3">
                    <div className="bg-white rounded-xl p-3 text-xs text-gray-600 space-y-2">
                      <p>Check-in: {progress.checkIn ? `${progress.checkIn.latitude.toFixed(5)}, ${progress.checkIn.longitude.toFixed(5)}` : 'Chưa ghi nhận'}</p>
                      <p>Check-out: {progress.checkOut ? `${progress.checkOut.latitude.toFixed(5)}, ${progress.checkOut.longitude.toFixed(5)}` : 'Chưa ghi nhận'}</p>
                      <p>Ảnh: {progress.photoConfirmation?.name || 'Chưa có ảnh xác nhận'}</p>
                    </div>
                    <BookingChat booking={booking} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#F0F4F8] rounded-2xl p-5 text-center">
          <p className="text-gray-600 text-sm">Chưa có lịch đặt nào.</p>
        </div>
      )}
    </section>
  );
}
