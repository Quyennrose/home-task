import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Home as HomeIcon
} from "lucide-react";
import { ServiceCard } from "@/app/components/ServiceCard";
import { HelperCard } from "@/app/components/HelperCard";
import { FeatureCard } from "@/app/components/FeatureCard";
import { BookingModal } from "@/app/components/BookingModal";
import { CustomerBookingCard } from "@/app/components/CustomerBookingCard";
import { HelperJobCard } from "@/app/components/HelperJobCard";
import { useScrollReveal } from "@/app/hooks/useScrollReveal";
import { HelperProfile } from "@/app/data/mockData";
import { Award, Briefcase, CheckCircle, ClipboardCheck, Clock, DollarSign, Camera, MapPin, Shield, Star } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { Booking } from "@/app/data/mockData";
import { localApi } from "@/app/utils/localApi";

type BookingFilter = 'all' | Booking['status'];
type HelperDayFilter = 'all' | 'today' | 'tomorrow' | 'week';

const bookingFilterOptions: { value: BookingFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
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

function splitList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

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

export default function HomePage() {
  const { user, updateUser } = useAuth();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedHelper, setSelectedHelper] = useState<string>("");
  const [selectedHelperId, setSelectedHelperId] = useState<string>("");
  const [selectedHourlyRate, setSelectedHourlyRate] = useState<number>(80000);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [helperBookings, setHelperBookings] = useState<Booking[]>([]);
  const [helperApplications, setHelperApplications] = useState<HelperProfile[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [helpers, setHelpers] = useState<HelperProfile[]>([]);
  const [helperStats, setHelperStats] = useState<Record<string, { rating: number; reviewsCount: number }>>({});
  const [customerBookingFilter, setCustomerBookingFilter] = useState<BookingFilter>('all');
  const [helperBookingFilter, setHelperBookingFilter] = useState<BookingFilter>('all');
  const [helperDayFilter, setHelperDayFilter] = useState<HelperDayFilter>('all');
  const [isEditingHelperProfile, setIsEditingHelperProfile] = useState(false);
  const [helperProfileForm, setHelperProfileForm] = useState({
    bio: '',
    skills: '',
    availability: '',
    serviceAreas: '',
    bankName: '',
    bankAccount: '',
  });

  // Kích hoạt Scroll Animation Engine
  useScrollReveal({
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px',
    once: true
  });

  const handleServiceClick = (service: string) => {
    setSelectedService(service);
    setSelectedHelper("");
    setSelectedHelperId("");
    setSelectedHourlyRate(80000);
    setIsBookingOpen(true);
  };

  const handleHelperBook = (helper: HelperProfile) => {
    setSelectedService(helper.service);
    setSelectedHelper(helper.name);
    setSelectedHelperId(helper.id);
    setSelectedHourlyRate(helper.hourlyRate);
    setIsBookingOpen(true);
  };

  // Get featured helpers (first 4)
  const featuredHelpers = helpers.slice(0, 4).map((helper) => ({
    ...helper,
    ...(helperStats[helper.id] ?? { rating: helper.rating, reviewsCount: helper.reviewsCount }),
  }));

  useEffect(() => {
    localApi.bookings.listByCustomer(user?.id).then(setRecentBookings);
    localApi.bookings.listByHelper(user?.id).then(setHelperBookings);
    if (user?.userType === 'admin') {
      localApi.helperApplications.list().then(setHelperApplications);
      localApi.bookings.listAll().then(setAllBookings);
    }
  }, [user?.id]);

  useEffect(() => {
    localApi.helpers.list().then(setHelpers);
  }, []);

  useEffect(() => {
    const featured = helpers.slice(0, 4);
    Promise.all(featured.map((helper) => localApi.reviews.getHelperRatingStats(helper.id))).then((stats) => {
      setHelperStats(Object.fromEntries(featured.map((helper, index) => [helper.id, stats[index]])));
    });
  }, [helpers]);

  const handleBookingCreated = () => {
    localApi.bookings.listByCustomer(user?.id).then(setRecentBookings);
  };

  const refreshHelperBookings = () => {
    localApi.bookings.listByHelper(user?.id).then(setHelperBookings);
  };

  const handleApplicationStatusChange = async (helperId: string, status: HelperProfile['applicationStatus']) => {
    await localApi.helperApplications.updateStatus(helperId, status);
    await localApi.notifications.create({
      userId: helperId,
      title: status === 'approved' ? 'Hồ sơ đã được duyệt' : 'Hồ sơ bị từ chối',
      message: status === 'approved'
        ? 'Bạn đã có thể nhận lịch đặt mới trong HomeTask.'
        : 'Vui lòng kiểm tra lại thông tin và bổ sung hồ sơ nếu cần.',
    });
    localApi.helperApplications.list().then(setHelperApplications);
  };

  const filteredCustomerBookings = recentBookings.filter((booking) => (
    customerBookingFilter === 'all' || booking.status === customerBookingFilter
  ));

  const filteredHelperBookings = helperBookings.filter((booking) => (
    (helperBookingFilter === 'all' || booking.status === helperBookingFilter) &&
    isBookingInDayFilter(booking, helperDayFilter)
  ));

  const openHelperProfileEditor = (helper: HelperProfile) => {
    setHelperProfileForm({
      bio: helper.bio ?? '',
      skills: helper.skills?.join(', ') ?? '',
      availability: helper.availability?.join(', ') ?? '',
      serviceAreas: helper.serviceAreas?.join(', ') ?? '',
      bankName: helper.bankName ?? '',
      bankAccount: helper.bankAccount ?? '',
    });
    setIsEditingHelperProfile(true);
  };

  const saveHelperProfile = async () => {
    await updateUser({
      bio: helperProfileForm.bio,
      skills: splitList(helperProfileForm.skills),
      availability: splitList(helperProfileForm.availability),
      serviceAreas: splitList(helperProfileForm.serviceAreas),
      bankName: helperProfileForm.bankName,
      bankAccount: helperProfileForm.bankAccount,
    });
    setIsEditingHelperProfile(false);
  };

  if (user?.userType === 'admin') {
    const pendingApplications = helperApplications.filter((application) => application.applicationStatus === 'pending').length;

    return (
      <>
        <section className="bg-gradient-to-br from-[#1A365D] to-[#2C5282] py-8 px-4 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1.5 rounded-full text-xs font-medium mb-4">
              <Shield className="w-3 h-3" />
              Quản trị vận hành
            </div>
            <h1 className="text-2xl font-bold mb-2">Duyệt hồ sơ người giúp việc</h1>
            <p className="text-[#E2E8F0] text-sm">
              Kiểm tra thông tin ứng tuyển, khu vực nhận việc và giấy tờ xác minh trước khi mở nhận lịch.
            </p>
          </motion.div>
        </section>

        <section className="py-6 px-4 bg-white">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F0F4F8] rounded-2xl p-4">
              <ClipboardCheck className="w-5 h-5 text-[#6366F1] mb-2" />
              <div className="text-2xl font-bold text-[#1A365D]">{pendingApplications}</div>
              <div className="text-xs text-gray-600">Hồ sơ chờ duyệt</div>
            </div>
            <div className="bg-[#F0F4F8] rounded-2xl p-4">
              <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
              <div className="text-2xl font-bold text-[#1A365D]">{helperApplications.length}</div>
              <div className="text-xs text-gray-600">Tổng hồ sơ</div>
            </div>
          </div>
        </section>

        <section className="py-6 px-4 bg-[#F0F4F8]">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[#1A365D] mb-1">Danh sách hồ sơ</h2>
            <p className="text-gray-600 text-sm">Hồ sơ mới nộp sẽ xuất hiện ở đây.</p>
          </div>

          {helperApplications.length > 0 ? (
            <div className="space-y-3">
              {helperApplications.map((application) => (
                <div key={application.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold text-[#1A365D] text-sm">{application.name}</h3>
                      <p className="text-xs text-gray-600 mt-1">{application.phone} - {application.email}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                      application.applicationStatus === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : application.applicationStatus === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {application.applicationStatus === 'approved'
                        ? 'Đã duyệt'
                        : application.applicationStatus === 'rejected'
                          ? 'Từ chối'
                          : 'Chờ duyệt'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-gray-600 mb-4">
                    <p>Kinh nghiệm: {application.experience}</p>
                    <p>Khu vực: {application.serviceAreas?.join(', ') || application.location}</p>
                    <p>Lịch làm: {application.availability?.join(', ')}</p>
                    <p>Ngân hàng: {application.bankName || 'Chưa khai báo'} {application.bankAccount ? `- ${application.bankAccount}` : ''}</p>
                    <p>Giấy tờ: {application.identityDocumentName || 'Chưa tải lên'}</p>
                    {application.applicationNote && <p>Ghi chú: {application.applicationNote}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplicationStatusChange(application.id, 'approved')}
                      disabled={application.applicationStatus === 'approved'}
                      className="px-3 py-2 bg-green-600 disabled:bg-gray-300 text-white rounded-xl text-xs font-semibold"
                    >
                      Duyệt hồ sơ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplicationStatusChange(application.id, 'rejected')}
                      disabled={application.applicationStatus === 'rejected'}
                      className="px-3 py-2 bg-red-50 disabled:bg-gray-100 text-red-600 border border-red-200 rounded-xl text-xs font-semibold"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
              <ClipboardCheck className="w-10 h-10 text-[#6366F1] mx-auto mb-3" />
              <h3 className="font-semibold text-[#1A365D] mb-1">Chưa có hồ sơ ứng tuyển</h3>
              <p className="text-gray-600 text-sm">
                Khi người giúp việc nộp đơn, admin sẽ thấy hồ sơ tại đây.
              </p>
            </div>
          )}
        </section>

        <section className="py-6 px-4 bg-white">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[#1A365D] mb-1">Quản lý lịch đặt</h2>
            <p className="text-gray-600 text-sm">Theo dõi tất cả lịch khách tạo trong demo này.</p>
          </div>

          {allBookings.length > 0 ? (
            <div className="space-y-3">
              {allBookings.map((booking) => (
                <div key={booking.id} className="bg-[#F0F4F8] rounded-2xl p-4 border border-[#E2E8F0]">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-semibold text-[#1A365D] text-sm">{booking.service}</h3>
                      <p className="text-xs text-gray-600 mt-1">{booking.helperName || 'Chưa chọn nhân viên'}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-semibold whitespace-nowrap">
                      {booking.status === 'pending' ? 'Chờ xác nhận' : booking.status === 'confirmed' ? 'Đã nhận' : booking.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>{new Date(booking.date).toLocaleDateString('vi-VN')} lúc {booking.time} - {booking.hours} giờ</p>
                    <p>{booking.address}</p>
                    <p>Thanh toán: {booking.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#F0F4F8] rounded-2xl p-5 text-center">
              <p className="text-gray-600 text-sm">Chưa có lịch đặt nào.</p>
            </div>
          )}
        </section>
      </>
    );
  }

  const helperProfile = user?.userType === 'helper' ? user as HelperProfile : null;
  const pendingHelperJobs = helperBookings.filter((booking) => booking.status === 'pending' || booking.status === 'confirmed');
  const projectedIncome = pendingHelperJobs.reduce((total, booking) => total + booking.totalPrice, 0);
  const applicationStatus = helperProfile?.applicationStatus ?? (helperProfile?.verified ? 'approved' : 'pending');
  const isApplicationApproved = applicationStatus === 'approved' && helperProfile?.verified;
  const applicationSteps = [
    { label: 'Đã gửi thông tin cá nhân', done: Boolean(helperProfile?.submittedAt || helperProfile?.createdAt) },
    { label: 'Đã khai báo khu vực và lịch làm', done: Boolean(helperProfile?.serviceAreas?.length && helperProfile?.availability?.length) },
    { label: 'Đã khai báo tài khoản nhận tiền', done: Boolean(helperProfile?.bankName && helperProfile?.bankAccount) },
    { label: 'Đã bổ sung giấy tờ xác minh', done: Boolean(helperProfile?.identityDocumentName || helperProfile?.verified) },
    { label: 'HomeTask duyệt hồ sơ', done: isApplicationApproved },
  ];

  if (helperProfile) {
    return (
      <>
        <section className="bg-gradient-to-br from-[#1A365D] to-[#2C5282] py-8 px-4 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-start gap-4">
              <img
                src={helperProfile.imageUrl}
                alt={helperProfile.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30"
              />
              <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-xs font-medium mb-2">
                <Shield className="w-3 h-3" />
                  {isApplicationApproved ? 'Đã được duyệt' : 'Hồ sơ chờ duyệt'}
                </div>
                <h1 className="text-2xl font-bold leading-tight">{helperProfile.name}</h1>
                <p className="text-[#E2E8F0] text-sm mt-1">{helperProfile.service}</p>
              </div>
            </div>
            <p className="text-[#E2E8F0] text-sm mt-5 leading-relaxed">
              Quản lý lịch nhận việc, theo dõi thu nhập dự kiến và kiểm tra hồ sơ dịch vụ của bạn.
            </p>
          </motion.div>
        </section>

        <section className="py-6 px-4 bg-white">
          {!isApplicationApproved && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <ClipboardCheck className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-bold text-[#1A365D] text-sm">Hồ sơ đang chờ xét duyệt</h2>
                  <p className="text-xs text-gray-600 mt-1">
                    Bạn đã nộp đơn. HomeTask sẽ kiểm tra thông tin, giấy tờ và khu vực nhận việc trước khi mở nhận lịch.
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {applicationSteps.map((step) => (
                  <div key={step.label} className="flex items-center gap-2 text-xs text-gray-700">
                    <CheckCircle className={`w-4 h-4 ${step.done ? 'text-green-600 fill-green-100' : 'text-gray-300'}`} />
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F0F4F8] rounded-2xl p-4">
              <Briefcase className="w-5 h-5 text-[#6366F1] mb-2" />
              <div className="text-2xl font-bold text-[#1A365D]">{isApplicationApproved ? pendingHelperJobs.length : 0}</div>
              <div className="text-xs text-gray-600">{isApplicationApproved ? 'Việc đang chờ' : 'Việc sau duyệt'}</div>
            </div>
            <div className="bg-[#F0F4F8] rounded-2xl p-4">
              <DollarSign className="w-5 h-5 text-[#6366F1] mb-2" />
              <div className="text-xl font-bold text-[#1A365D]">{isApplicationApproved ? projectedIncome.toLocaleString('vi-VN') : '0'} đ</div>
              <div className="text-xs text-gray-600">Thu nhập dự kiến</div>
            </div>
            <div className="bg-[#F0F4F8] rounded-2xl p-4">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 mb-2" />
              <div className="text-2xl font-bold text-[#1A365D]">{helperProfile.rating?.toFixed(1) ?? '0.0'}</div>
              <div className="text-xs text-gray-600">Đánh giá</div>
            </div>
            <div className="bg-[#F0F4F8] rounded-2xl p-4">
              <Award className="w-5 h-5 text-[#6366F1] mb-2" />
              <div className="text-2xl font-bold text-[#1A365D]">{helperProfile.completedJobs ?? 0}</div>
              <div className="text-xs text-gray-600">Việc hoàn thành</div>
            </div>
          </div>
        </section>

        <section className="py-6 px-4 bg-[#F0F4F8]">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[#1A365D] mb-1">Việc được đặt</h2>
            <p className="text-gray-600 text-sm">Các lịch khách đã chọn đúng hồ sơ của bạn.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <select
              value={helperBookingFilter}
              onChange={(event) => setHelperBookingFilter(event.target.value as BookingFilter)}
              className="px-3 py-2 border border-gray-300 rounded-xl bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            >
              {bookingFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={helperDayFilter}
              onChange={(event) => setHelperDayFilter(event.target.value as HelperDayFilter)}
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
          ) : filteredHelperBookings.length > 0 ? (
            <div className="space-y-3">
              {filteredHelperBookings.map((booking) => (
                <HelperJobCard key={booking.id} booking={booking} onBookingUpdated={refreshHelperBookings} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
              <ClipboardCheck className="w-10 h-10 text-[#6366F1] mx-auto mb-3" />
              <h3 className="font-semibold text-[#1A365D] mb-1">Chưa có lịch mới</h3>
              <p className="text-gray-600 text-sm">
                Khi khách chọn bạn ở trang Nhân viên, lịch đặt sẽ xuất hiện tại đây.
              </p>
            </div>
          )}
        </section>

        <section className="py-6 px-4 bg-white">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#1A365D] mb-1">Hồ sơ làm việc</h2>
              <p className="text-gray-600 text-sm">{helperProfile.bio}</p>
            </div>
            <button
              type="button"
              onClick={() => openHelperProfileEditor(helperProfile)}
              className="px-3 py-2 bg-[#6366F1]/10 text-[#6366F1] rounded-xl text-xs font-semibold whitespace-nowrap"
            >
              Sửa hồ sơ
            </button>
          </div>

          <div className="space-y-4">
            {isEditingHelperProfile && (
              <div className="bg-[#F0F4F8] rounded-2xl p-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A365D] mb-1">Giới thiệu</label>
                  <textarea
                    value={helperProfileForm.bio}
                    onChange={(event) => setHelperProfileForm((form) => ({ ...form, bio: event.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A365D] mb-1">Kỹ năng, cách nhau bằng dấu phẩy</label>
                  <input
                    value={helperProfileForm.skills}
                    onChange={(event) => setHelperProfileForm((form) => ({ ...form, skills: event.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A365D] mb-1">Lịch có thể làm</label>
                  <input
                    value={helperProfileForm.availability}
                    onChange={(event) => setHelperProfileForm((form) => ({ ...form, availability: event.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A365D] mb-1">Khu vực nhận việc</label>
                  <input
                    value={helperProfileForm.serviceAreas}
                    onChange={(event) => setHelperProfileForm((form) => ({ ...form, serviceAreas: event.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#1A365D] mb-1">Ngân hàng</label>
                    <input
                      value={helperProfileForm.bankName}
                      onChange={(event) => setHelperProfileForm((form) => ({ ...form, bankName: event.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A365D] mb-1">Số tài khoản</label>
                    <input
                      value={helperProfileForm.bankAccount}
                      onChange={(event) => setHelperProfileForm((form) => ({ ...form, bankAccount: event.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={saveHelperProfile}
                    className="px-3 py-2 bg-[#6366F1] text-white rounded-xl text-xs font-semibold"
                  >
                    Lưu thay đổi
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingHelperProfile(false)}
                    className="px-3 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-[#1A365D] text-sm mb-2">Kỹ năng</h3>
              <div className="flex flex-wrap gap-2">
                {helperProfile.skills?.map((skill) => (
                  <span key={skill} className="px-3 py-1.5 bg-[#6366F1]/10 text-[#6366F1] rounded-full text-xs font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-[#1A365D] text-sm mb-2">Lịch có thể làm</h3>
              <div className="flex flex-wrap gap-2">
                {helperProfile.availability?.map((day) => (
                  <span key={day} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
                    {day}
                  </span>
                ))}
              </div>
            </div>
            {helperProfile.serviceAreas && helperProfile.serviceAreas.length > 0 && (
              <div>
                <h3 className="font-semibold text-[#1A365D] text-sm mb-2">Khu vực nhận việc</h3>
                <div className="flex flex-wrap gap-2">
                  {helperProfile.serviceAreas.map((area) => (
                    <span key={area} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {helperProfile.bankName && (
              <div className="bg-[#F0F4F8] rounded-xl p-4">
                <h3 className="font-semibold text-[#1A365D] text-sm mb-1">Thanh toán</h3>
                <p className="text-xs text-gray-600">{helperProfile.bankName} - {helperProfile.bankAccount}</p>
              </div>
            )}
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#F0F4F8] via-white to-[#F0F4F8] py-8 px-4">
        <div className="max-w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-[#6366F1]/10 text-[#6366F1] px-3 py-1.5 rounded-full text-xs font-medium mb-4">
              <Shield className="w-3 h-3" />
              Quản lý minh bạch
            </div>
            <h1 className="text-2xl font-bold text-[#1A365D] mb-3 leading-tight">
              Dịch vụ dọn dẹp nhà
              <span className="text-[#6366F1]"> chuyên nghiệp</span>
            </h1>
            <p className="text-gray-600 text-sm mb-5 leading-relaxed">
              HomeTask kết nối bạn với người giúp việc uy tín, được xác thực.
              Quản lý toàn bộ quy trình với checklist, GPS và xác nhận hình ảnh.
            </p>
            <div className="flex flex-col gap-3">
              <button
                data-testid="home-book-service"
                onClick={() => handleServiceClick("Dọn dẹp nhà")}
                className="w-full px-6 py-3 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-xl font-semibold transition-colors shadow-lg shadow-[#6366F1]/30"
              >
                Đặt dịch vụ ngay
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 bg-white rounded-xl p-4 shadow-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#6366F1] mb-1">3000+</div>
                <div className="text-gray-600 text-xs">Khách hàng</div>
              </div>
              <div className="text-center border-x border-gray-200">
                <div className="text-2xl font-bold text-[#6366F1] mb-1">200+</div>
                <div className="text-gray-600 text-xs">Nhân viên</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#6366F1] mb-1">4.9</div>
                <div className="text-gray-600 text-xs">Đánh giá</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {recentBookings.length > 0 && (
        <section className="py-6 px-4 bg-white">
          <div className="max-w-full">
            <div className="mb-4" data-vibe="reveal">
              <h2 className="text-lg font-bold text-[#1A365D] mb-1">Lịch đặt gần đây</h2>
              <p className="text-gray-600 text-sm">Theo dõi các yêu cầu dọn dẹp bạn vừa tạo.</p>
            </div>

            <select
              value={customerBookingFilter}
              onChange={(event) => setCustomerBookingFilter(event.target.value as BookingFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#6366F1] mb-4"
            >
              {bookingFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            {filteredCustomerBookings.length > 0 ? (
              <div className="space-y-3">
              {filteredCustomerBookings.map((booking) => (
                <CustomerBookingCard
                  key={booking.id}
                  booking={booking}
                  onBookingUpdated={handleBookingCreated}
                  onReviewCreated={handleBookingCreated}
                />
              ))}
              </div>
            ) : (
              <div className="bg-[#F0F4F8] rounded-2xl p-5 text-center">
                <p className="text-gray-600 text-sm">Không có lịch nào khớp bộ lọc này.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Services Section */}
      <section id="services" className="py-8 px-4 bg-white">
        <div className="max-w-full">
          <div className="mb-5" data-vibe="reveal">
            <h2 className="text-xl font-bold text-[#1A365D] mb-2">
              Dịch vụ của chúng tôi
            </h2>
            <p className="text-gray-600 text-sm">
              Dịch vụ dọn dẹp nhà chuyên nghiệp với quy trình quản lý chặt chẽ
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div data-vibe="reveal" data-delay="1">
              <ServiceCard
                icon={HomeIcon}
                title="Dọn dẹp nhà"
                description="Dịch vụ vệ sinh, dọn dẹp nhà cửa chuyên nghiệp. Không gian sạch sẽ, ngăn nắp với checklist đầy đủ."
                color="bg-[#1A365D]"
                delay={0}
                onClick={() => handleServiceClick("Dọn dẹp nhà")}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Helpers Section */}
      <section id="helpers" className="py-8 px-4 bg-[#F0F4F8]">
        <div className="max-w-full">
          <div className="mb-5" data-vibe="reveal">
            <h2 className="text-xl font-bold text-[#1A365D] mb-2">
              Nhân viên nổi bật
            </h2>
            <p className="text-gray-600 text-sm">
              Đội ngũ được đào tạo bài bản, có chứng chỉ và kinh nghiệm thực tế
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {featuredHelpers.map((helper, index) => (
              <div key={helper.id} data-vibe="reveal" data-delay={index + 1}>
                <HelperCard
                  name={helper.name}
                  service={helper.service}
                  rating={helper.rating}
                  reviews={helper.reviewsCount}
                  experience={helper.experience}
                  location={helper.location}
                  verified={helper.verified}
                  imageUrl={helper.imageUrl}
                  delay={0}
                  onBook={() => handleHelperBook(helper)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-8 px-4 bg-white">
        <div className="max-w-full">
          <div className="mb-5" data-vibe="reveal">
            <h2 className="text-xl font-bold text-[#1A365D] mb-2">
              Tại sao chọn HomeTask?
            </h2>
            <p className="text-gray-600 text-sm">
              Công nghệ quản lý giúp minh bạch hóa quy trình làm việc
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div data-vibe="reveal" data-delay="1">
              <FeatureCard
                icon={CheckCircle}
                title="Checklist công việc"
                description="Danh sách công việc chi tiết, đảm bảo không bỏ sót công đoạn nào"
                delay={0}
              />
            </div>
            <div data-vibe="reveal" data-delay="2">
              <FeatureCard
                icon={Camera}
                title="Xác nhận hình ảnh"
                description="Chụp ảnh trước/sau khi làm việc để khách hàng kiểm tra"
                delay={0}
              />
            </div>
            <div data-vibe="reveal" data-delay="3">
              <FeatureCard
                icon={MapPin}
                title="Định vị GPS"
                description="Theo dõi check-in/check-out chính xác theo thời gian thực"
                delay={0}
              />
            </div>
            <div data-vibe="reveal" data-delay="4">
              <FeatureCard
                icon={Clock}
                title="Theo dõi thời gian"
                description="Giám sát tiến độ công việc mọi lúc mọi nơi qua app"
                delay={0}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 px-4 bg-gradient-to-br from-[#1A365D] to-[#2C5282] mx-4 my-6 rounded-2xl">
        <div className="max-w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-white mb-3">
              Sẵn sàng trải nghiệm dịch vụ?
            </h2>
            <p className="text-[#E2E8F0] text-sm mb-6">
              Đặt lịch ngay hôm nay và nhận ưu đãi 20% cho lần đầu sử dụng
            </p>
            <button
              data-testid="home-cta-book-service"
              onClick={() => handleServiceClick("Dọn dẹp nhà")}
              className="w-full px-6 py-3 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-xl font-semibold transition-colors shadow-xl"
            >
              Đặt dịch vụ ngay
            </button>
          </motion.div>
        </div>
      </section>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        service={selectedService}
        helperName={selectedHelper}
        helperId={selectedHelperId}
        hourlyRate={selectedHourlyRate}
        onBookingCreated={handleBookingCreated}
      />
    </>
  );
}
