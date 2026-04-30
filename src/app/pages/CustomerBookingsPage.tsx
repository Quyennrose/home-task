import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { CustomerBookingCard } from '@/app/components/CustomerBookingCard';
import { useAuth } from '@/app/contexts/AuthContext';
import { Booking } from '@/app/data/mockData';
import { localApi } from '@/app/utils/localApi';

type BookingFilter = 'all' | Booking['status'];

const bookingFilterOptions: { value: BookingFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã nhận' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];

export default function CustomerBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<BookingFilter>('all');

  const refreshBookings = () => {
    localApi.bookings.listByCustomer(user?.id).then(setBookings);
  };

  useEffect(() => {
    refreshBookings();
  }, [user?.id]);

  const filteredBookings = bookings.filter((booking) => (
    filter === 'all' || booking.status === filter
  ));

  return (
    <section className="py-6 px-4 bg-white min-h-full">
      <div className="mb-5">
        <div className="inline-flex items-center gap-2 bg-[#6366F1]/10 text-[#6366F1] px-3 py-1.5 rounded-full text-xs font-medium mb-3">
          <CalendarDays className="w-3 h-3" />
          Lịch của tôi
        </div>
        <h1 className="text-2xl font-bold text-[#1A365D] mb-2">Quản lý lịch đặt</h1>
        <p className="text-gray-600 text-sm">
          Theo dõi trạng thái, GPS, checklist, ảnh xác nhận, thanh toán và đánh giá sau khi hoàn thành.
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

      {filteredBookings.length > 0 ? (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <CustomerBookingCard
              key={booking.id}
              booking={booking}
              onBookingUpdated={refreshBookings}
              onReviewCreated={refreshBookings}
            />
          ))}
        </div>
      ) : (
        <div className="bg-[#F0F4F8] rounded-2xl p-5 text-center">
          <p className="text-gray-600 text-sm">Chưa có lịch nào khớp bộ lọc này.</p>
        </div>
      )}
    </section>
  );
}
