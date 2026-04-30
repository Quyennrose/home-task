import { useState } from 'react';
import { motion } from 'motion/react';
import { Home, CheckCircle, Clock, Shield, Star, Camera, MapPin } from 'lucide-react';
import { getHelpersByService } from '@/app/data/mockData';
import { HelperCard } from '@/app/components/HelperCard';
import { BookingModal } from '@/app/components/BookingModal';
import { useScrollReveal } from '@/app/hooks/useScrollReveal';

interface ServiceDetail {
  id: string;
  icon: typeof Home;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  features: string[];
  pricing: {
    hourly: number;
    daily: number;
  };
}

const servicesData: ServiceDetail[] = [
  {
    id: 'don-dep-nha',
    icon: Home,
    title: 'Dọn dẹp nhà',
    description: 'Vệ sinh, dọn dẹp nhà cửa sạch sẽ, ngăn nắp với quy trình quản lý chuyên nghiệp',
    color: 'text-[#6366F1]',
    bgColor: 'bg-[#6366F1]',
    features: [
      'Vệ sinh tổng thể toàn bộ nhà',
      'Lau chùi, hút bụi các phòng',
      'Vệ sinh nhà bếp, toilet chuyên sâu',
      'Giặt ủi quần áo, giường chiếu',
      'Lau kính, ban công, cửa sổ',
      'Tổ chức sắp xếp đồ đạc ngăn nắp',
      'Checklist công việc chi tiết',
      'Xác nhận hình ảnh trước/sau',
      'GPS tracking thời gian làm việc'
    ],
    pricing: {
      hourly: 80000,
      daily: 240000
    }
  }
];

export default function ServicesPage() {
  const [selectedService] = useState<ServiceDetail>(servicesData[0]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedHelper, setSelectedHelper] = useState<string>("");
  const [selectedHelperId, setSelectedHelperId] = useState<string>("");
  const [selectedHourlyRate, setSelectedHourlyRate] = useState<number>(selectedService.pricing.hourly);

  useScrollReveal({
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px',
    once: true
  });

  const helpers = getHelpersByService(selectedService.title);

  const handleBookService = () => {
    setSelectedHelper("");
    setSelectedHelperId("");
    setSelectedHourlyRate(selectedService.pricing.hourly);
    setIsBookingOpen(true);
  };

  const handleHelperBook = (helperId: string, helperName: string, hourlyRate: number) => {
    setSelectedHelperId(helperId);
    setSelectedHelper(helperName);
    setSelectedHourlyRate(hourlyRate);
    setIsBookingOpen(true);
  };

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
              Dịch vụ của chúng tôi
            </h1>
            <p className="text-gray-600 text-sm">
              Dịch vụ dọn dẹp nhà chuyên nghiệp với quy trình quản lý minh bạch
            </p>
          </motion.div>
        </div>
      </section>

      {/* Service Detail */}
      <section className="py-6 px-4 bg-white">
        <div className="max-w-full">
          <motion.div
            key={selectedService.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Service Info */}
            <div className="mb-6">
              <div className={`${selectedService.bgColor} w-16 h-16 rounded-2xl flex items-center justify-center mb-4`}>
                <selectedService.icon className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-xl font-bold text-[#1A365D] mb-2">{selectedService.title}</h2>
              <p className="text-gray-600 text-sm mb-6">{selectedService.description}</p>

              <div className="bg-gradient-to-br from-[#F0F4F8] to-[#E2E8F0] rounded-2xl p-5 mb-6">
                <h3 className="font-semibold text-[#1A365D] mb-4 flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-[#6366F1]" />
                  Bảng giá dịch vụ
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 text-sm">Theo giờ</span>
                    <span className="text-xl font-bold text-[#6366F1]">
                      {selectedService.pricing.hourly.toLocaleString('vi-VN')} đ/giờ
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 text-sm">Theo ca (3 giờ)</span>
                    <span className="text-xl font-bold text-[#6366F1]">
                      {selectedService.pricing.daily.toLocaleString('vi-VN')} đ/ca
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-[#F0F4F8] rounded-2xl p-5 mb-6">
              <h3 className="font-semibold text-[#1A365D] mb-5 flex items-center gap-2 text-sm">
                <CheckCircle className="w-5 h-5 text-[#6366F1]" />
                Nội dung dịch vụ
              </h3>

              <ul className="space-y-3">
                {selectedService.features.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-start gap-2"
                  >
                    <CheckCircle className="w-4 h-4 text-[#6366F1] mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Shield className="w-4 h-4 text-[#1A365D]" />
                  <span>Tất cả nhân viên đều được xác thực và có bảo hiểm</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span>Đánh giá trung bình 4.9/5 sao từ khách hàng</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Camera className="w-4 h-4 text-[#6366F1]" />
                  <span>Xác nhận hình ảnh trước và sau khi làm việc</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <MapPin className="w-4 h-4 text-[#6366F1]" />
                  <span>GPS tracking theo dõi thời gian làm việc</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleBookService}
              className="w-full py-3 bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white font-semibold rounded-xl transition-colors shadow-lg text-sm"
            >
              Đặt dịch vụ ngay
            </button>
          </motion.div>
        </div>
      </section>

      {/* Available Helpers */}
      <section className="py-6 px-4 bg-[#F0F4F8]">
        <div className="max-w-full">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-[#1A365D] mb-2">
              Nhân viên có sẵn
            </h2>
            <p className="text-gray-600 text-sm">
              Chọn nhân viên phù hợp với nhu cầu của bạn
            </p>
          </div>

          {helpers.length > 0 ? (
            <div className="flex flex-col gap-4">
              {helpers.map((helper) => (
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
                  onBook={() => handleHelperBook(helper.id, helper.name, helper.hourlyRate)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">Hiện tại chưa có nhân viên cho dịch vụ này</p>
            </div>
          )}
        </div>
      </section>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        service={selectedService.title}
        helperName={selectedHelper}
        helperId={selectedHelperId}
        hourlyRate={selectedHourlyRate}
      />
    </>
  );
}
