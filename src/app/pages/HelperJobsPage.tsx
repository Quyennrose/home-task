import { useEffect, useState } from 'react';
import { Briefcase, ClipboardCheck } from 'lucide-react';
import { HelperJobCard } from '@/app/components/HelperJobCard';
import { useAuth } from '@/app/contexts/AuthContext';
import { Booking, HelperProfile } from '@/app/data/mockData';
import { localApi } from '@/app/utils/localApi';

type BookingFilter = 'all' | Booking['status'];
type HelperDayFilter = 'all' | 'today' | 'tomorrow' | 'week';

const bookingFilterOptions: { value: BookingFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ nhận' },
  { value: 'confirmed', label: 'Đã nhận' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const dayFilterOptions: { value: HelperDayFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả ngày' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'tomorrow', label: 'Ngày mai' },
  { value: 'week', label: '7 ngày tới' },
];

function isBookingInDayFilter(booking: Booking, filter: HelperDayFilter) {
  if (filter === 'all') {
    return true;
  }

  const bookingDate = new Date(`${booking.date}T00:00:00`).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (filter === 'today') {
    return bookingDate === todayTime;
  }

  if (filter === 'tomorrow') {
    return bookingDate === todayTime + oneDay;
  }

  return bookingDate >= todayTime && bookingDate <= todayTime + oneDay * 7;
}

export default function HelperJobsPage() {
  const { user } = useAuth();
  const helperProfile = user?.userType === 'helper' ? user as HelperProfile : null;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<BookingFilter>('all');
  const [dayFilter, setDayFilter] = useState<HelperDayFilter>('all');

  const refreshBookings = () => {
    localApi.bookings.listByHelper(user?.id).then(setBookings);
  };

  useEffect(() => {
    refreshBookings();
  }, [user?.id]);

  const isApplicationApproved = (helperProfile?.applicationStatus ?? (helperProfile?.verified ? 'approved' : 'pending')) === 'approved' && helperProfile?.verified;
  const filteredBookings = bookings.filter((booking) => (
    (statusFilter === 'all' || booking.status === statusFilter) &&
    isBookingInDayFilter(booking, dayFilter)
  ));

  return (
    <section className="py-6 px-4 bg-[#F0F4F8] min-h-full">
      <div className="mb-5">
        <div className="inline-flex items-center gap-2 bg-[#6366F1]/10 text-[#6366F1] px-3 py-1.5 rounded-full text-xs font-medium mb-3">
          <Briefcase className="w-3 h-3" />
          Công việc
        </div>
        <h1 className="text-2xl font-bold text-[#1A365D] mb-2">Lịch khách đã đặt</h1>
        <p className="text-gray-600 text-sm">
          Nhận hoặc từ chối lịch, check-in GPS, hoàn thành checklist, tải ảnh xác nhận và trao đổi với khách.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as BookingFilter)}
          className="px-3 py-2 border border-gray-300 rounded-xl bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
        >
          {bookingFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select
          value={dayFilter}
          onChange={(event) => setDayFilter(event.target.value as HelperDayFilter)}
          className="px-3 py-2 border border-gray-300 rounded-xl bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
        >
          {dayFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {!isApplicationApproved ? (
        <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
          <ClipboardCheck className="w-10 h-10 text-[#6366F1] mx-auto mb-3" />
          <h3 className="font-semibold text-[#1A365D] mb-1">Chưa mở nhận việc</h3>
          <p className="text-gray-600 text-sm">
            Sau khi hồ sơ được duyệt, lịch khách đặt sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <HelperJobCard key={booking.id} booking={booking} onBookingUpdated={refreshBookings} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
          <ClipboardCheck className="w-10 h-10 text-[#6366F1] mx-auto mb-3" />
          <h3 className="font-semibold text-[#1A365D] mb-1">Chưa có lịch phù hợp</h3>
          <p className="text-gray-600 text-sm">Thử đổi bộ lọc hoặc chờ khách đặt lịch mới.</p>
        </div>
      )}
    </section>
  );
}
