import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, MapPin, Star, Shield, Award, Briefcase, CheckCircle } from 'lucide-react';
import { HelperProfile, Review } from '@/app/data/mockData';
import { HelperCard } from '@/app/components/HelperCard';
import { ReviewCard } from '@/app/components/ReviewCard';
import { BookingModal } from '@/app/components/BookingModal';
import { useScrollReveal } from '@/app/hooks/useScrollReveal';
import { localApi } from '@/app/utils/localApi';

type SortOption = 'rating' | 'jobs' | 'reviews';

const services = ['Tất cả', 'Dọn dẹp nhà'];
const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'rating', label: 'Đánh giá cao nhất' },
  { value: 'jobs', label: 'Nhiều việc đã làm' },
  { value: 'reviews', label: 'Nhiều đánh giá nhất' },
];

export default function HelpersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<string>('Tất cả');
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [selectedHelper, setSelectedHelper] = useState<string | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingHelperName, setBookingHelperName] = useState('');
  const [bookingService, setBookingService] = useState('');
  const [bookingHelperId, setBookingHelperId] = useState('');
  const [bookingHourlyRate, setBookingHourlyRate] = useState(80000);
  const [helpers, setHelpers] = useState<HelperProfile[]>([]);
  const [helperStats, setHelperStats] = useState<Record<string, { rating: number; reviewsCount: number }>>({});
  const [helperReviews, setHelperReviews] = useState<Review[]>([]);

  useScrollReveal({
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px',
    once: true
  });

  useEffect(() => {
    localApi.helpers.list().then(setHelpers);
  }, []);

  useEffect(() => {
    Promise.all(helpers.map((helper) => localApi.reviews.getHelperRatingStats(helper.id))).then((stats) => {
      setHelperStats(Object.fromEntries(helpers.map((helper, index) => [helper.id, stats[index]])));
    });
  }, [helpers]);

  useEffect(() => {
    if (!selectedHelper) {
      setHelperReviews([]);
      return;
    }

    localApi.reviews.getForHelper(selectedHelper).then(setHelperReviews);
  }, [selectedHelper]);

  // Filter helpers
  const filteredHelpers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return helpers
      .map((helper) => ({
        ...helper,
        ...(helperStats[helper.id] ?? { rating: helper.rating, reviewsCount: helper.reviewsCount }),
      }))
      .filter((helper) => {
        const searchableText = [
          helper.name,
          helper.location,
          helper.service,
          helper.experience,
          ...helper.skills,
        ].join(' ').toLowerCase();
        const matchesSearch = !normalizedQuery || searchableText.includes(normalizedQuery);
        const matchesService = selectedService === 'Tất cả' || helper.service === selectedService;
        return matchesSearch && matchesService;
      })
      .sort((a, b) => {
        if (sortBy === 'jobs') {
          return b.completedJobs - a.completedJobs;
        }

        if (sortBy === 'reviews') {
          return b.reviewsCount - a.reviewsCount;
        }

        return b.rating - a.rating || b.reviewsCount - a.reviewsCount;
      });
  }, [helpers, helperStats, searchQuery, selectedService, sortBy]);

  const handleHelperBook = (helper: HelperProfile) => {
    setBookingService(helper.service);
    setBookingHelperName(helper.name);
    setBookingHelperId(helper.id);
    setBookingHourlyRate(helper.hourlyRate);
    setIsBookingOpen(true);
  };

  const handleViewDetails = (helperId: string) => {
    setSelectedHelper(selectedHelper === helperId ? null : helperId);
  };

  const selectedHelperData = selectedHelper
    ? helpers
        .map((helper) => ({
          ...helper,
          ...(helperStats[helper.id] ?? { rating: helper.rating, reviewsCount: helper.reviewsCount }),
        }))
        .find(h => h.id === selectedHelper)
    : null;

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#F0F4F8] via-white to-[#F0F4F8] py-8 px-4">
        <div className="max-w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-2xl font-bold text-[#1A365D] mb-3">
              Đội ngũ nhân viên chuyên nghiệp
            </h1>
            <p className="text-gray-600 text-sm mb-6">
              Tất cả nhân viên đều được xác thực, đào tạo bài bản và có kinh nghiệm thực tế
            </p>

            {/* Search & Filter */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên hoặc địa điểm..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent text-sm bg-white"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent appearance-none bg-white text-sm"
                >
                  {services.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent appearance-none bg-white text-sm"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-gray-500">
                Tìm thấy {filteredHelpers.length} nhân viên
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Helpers List */}
      <section className="py-6 px-4 bg-white">
        <div className="max-w-full">
          {filteredHelpers.length > 0 ? (
            <div className="flex flex-col gap-4">
              {filteredHelpers.map((helper) => (
                <HelperCard
                  key={helper.id}
                  name={helper.name}
                  service={helper.service}
                  rating={helper.rating}
                  reviews={helper.reviewsCount}
                  experience={helper.experience}
                  location={helper.location}
                  verified={helper.verified}
                  imageUrl={helper.imageUrl}
                  onBook={() => handleHelperBook(helper)}
                  onViewDetails={() => handleViewDetails(helper.id)}
                  detailsLabel={selectedHelper === helper.id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-2xl">
              <p className="text-gray-600 text-sm">Không tìm thấy nhân viên phù hợp.</p>
            </div>
          )}
        </div>
      </section>

      {/* Helper Details Modal */}
      {selectedHelperData && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto"
          onClick={() => setSelectedHelper(null)}
        >
          <div className="min-h-screen py-6 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="max-w-full mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative h-32 bg-gradient-to-br from-[#1A365D] to-[#2C5282]">
                <button
                  type="button"
                  onClick={() => setSelectedHelper(null)}
                  aria-label="Đóng"
                  className="absolute top-3 right-3 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors text-sm"
                >
                  ✕
                </button>
                <div className="absolute -bottom-12 left-4">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                    <img
                      src={selectedHelperData.imageUrl}
                      alt={selectedHelperData.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-16 px-5 pb-5">
                {/* Basic Info */}
                <div className="mb-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-[#1A365D]">{selectedHelperData.name}</h2>
                        {selectedHelperData.verified && (
                          <Shield className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <p className="text-[#6366F1] font-medium text-sm">{selectedHelperData.service}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600 text-xs">{selectedHelperData.location}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-xl">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-lg font-bold text-gray-900">{selectedHelperData.rating}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{selectedHelperData.reviewsCount} đánh giá</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  <div className="bg-[#F0F4F8] rounded-xl p-3 text-center">
                    <Briefcase className="w-5 h-5 text-[#6366F1] mx-auto mb-1" />
                    <div className="text-lg font-bold text-[#1A365D]">{selectedHelperData.completedJobs}</div>
                    <div className="text-[10px] text-gray-600">Công việc</div>
                  </div>
                  <div className="bg-[#F0F4F8] rounded-xl p-3 text-center">
                    <Award className="w-5 h-5 text-[#6366F1] mx-auto mb-1" />
                    <div className="text-lg font-bold text-[#1A365D]">{selectedHelperData.experience}</div>
                    <div className="text-[10px] text-gray-600">Kinh nghiệm</div>
                  </div>
                  <div className="bg-[#F0F4F8] rounded-xl p-3 text-center">
                    <CheckCircle className="w-5 h-5 text-[#6366F1] mx-auto mb-1" />
                    <div className="text-lg font-bold text-[#1A365D]">{(selectedHelperData.hourlyRate / 1000).toFixed(0)}k</div>
                    <div className="text-[10px] text-gray-600">Giá/giờ</div>
                  </div>
                </div>

                {/* Bio */}
                <div className="mb-5">
                  <h3 className="font-semibold text-[#1A365D] mb-2 text-sm">Giới thiệu</h3>
                  <p className="text-gray-700 leading-relaxed text-sm">{selectedHelperData.bio}</p>
                </div>

                {/* Skills */}
                <div className="mb-5">
                  <h3 className="font-semibold text-[#1A365D] mb-2 text-sm">Kỹ năng</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedHelperData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-[#6366F1]/10 text-[#6366F1] rounded-full text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                {selectedHelperData.certifications.length > 0 && (
                  <div className="mb-5">
                    <h3 className="font-semibold text-[#1A365D] mb-2 text-sm">Chứng chỉ</h3>
                    <ul className="space-y-2">
                      {selectedHelperData.certifications.map((cert, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-700 text-sm">
                          <CheckCircle className="w-4 h-4 text-[#6366F1] flex-shrink-0" />
                          {cert}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Availability */}
                <div className="mb-5">
                  <h3 className="font-semibold text-[#1A365D] mb-2 text-sm">Lịch có thể làm việc</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedHelperData.availability.map((day, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium"
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Reviews */}
                <div className="mb-5">
                  <h3 className="font-semibold text-[#1A365D] mb-3 text-sm">
                    Đánh giá từ khách hàng ({helperReviews.length})
                  </h3>
                  {helperReviews.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {helperReviews.map((review, index) => (
                        <ReviewCard key={review.id} review={review} delay={index * 0.1} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-6 text-sm">Chưa có đánh giá nào</p>
                  )}
                </div>

                {/* Book Button */}
                <button
                  onClick={() => {
                    handleHelperBook(selectedHelperData);
                    setSelectedHelper(null);
                  }}
                  className="w-full py-3 bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white font-semibold rounded-xl transition-colors text-sm"
                >
                  Đặt lịch với {selectedHelperData.name}
                </button>
              </div>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        service={bookingService}
        helperName={bookingHelperName}
        helperId={bookingHelperId}
        hourlyRate={bookingHourlyRate}
      />
    </>
  );
}
