import { motion } from 'motion/react';
import { Home, CheckCircle, Camera, MapPin, Clock, Shield, Target, TrendingUp, Award, Users, Phone, Mail, MessageSquare } from 'lucide-react';
import { useScrollReveal } from '@/app/hooks/useScrollReveal';

export default function AboutPage() {
  useScrollReveal({
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px',
    once: true
  });

  const stats = [
    { icon: Users, number: '3000+', label: 'Khách hàng' },
    { icon: Award, number: '200+', label: 'Nhân viên' },
    { icon: Shield, number: '100%', label: 'Xác thực' },
    { icon: CheckCircle, number: '4.9/5', label: 'Đánh giá' }
  ];

  const features = [
    {
      icon: CheckCircle,
      title: 'Checklist công việc',
      description: 'Danh sách công việc chi tiết từng bước, đảm bảo không bỏ sót công đoạn nào',
      color: 'bg-[#1A365D]'
    },
    {
      icon: Camera,
      title: 'Xác nhận hình ảnh',
      description: 'Chụp ảnh trước và sau khi làm việc, minh bạch hóa kết quả công việc',
      color: 'bg-[#2C5282]'
    },
    {
      icon: MapPin,
      title: 'Định vị GPS',
      description: 'Theo dõi check-in/check-out chính xác, đảm bảo thời gian làm việc đúng cam kết',
      color: 'bg-[#1A365D]'
    },
    {
      icon: Clock,
      title: 'Theo dõi thời gian thực',
      description: 'Khách hàng theo dõi tiến độ công việc qua ứng dụng mọi lúc mọi nơi',
      color: 'bg-[#6366F1]'
    }
  ];

  const values = [
    {
      icon: Shield,
      title: 'Minh bạch',
      description: 'Quy trình làm việc rõ ràng với checklist, GPS và hình ảnh xác nhận mỗi công đoạn.'
    },
    {
      icon: Target,
      title: 'Kiểm soát chất lượng',
      description: 'Hệ thống quản lý giúp giám sát chặt chẽ, đảm bảo chất lượng dịch vụ tốt nhất.'
    },
    {
      icon: Users,
      title: 'Giảm tranh chấp',
      description: 'Dữ liệu rõ ràng về thời gian, địa điểm và kết quả công việc giúp tránh hiểu lầm.'
    },
    {
      icon: TrendingUp,
      title: 'Hiệu quả cao',
      description: 'Công nghệ giúp tối ưu quy trình, tiết kiệm thời gian cho cả khách hàng và nhân viên.'
    }
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Đặt lịch',
      description: 'Chọn dịch vụ, thời gian và nhân viên phù hợp qua ứng dụng'
    },
    {
      step: '2', 
      title: 'GPS Check-in',
      description: 'Nhân viên check-in bằng GPS khi bắt đầu công việc tại địa điểm'
    },
    {
      step: '3',
      title: 'Thực hiện Checklist',
      description: 'Làm việc theo checklist chi tiết, đánh dấu hoàn thành từng bước'
    },
    {
      step: '4',
      title: 'Xác nhận hình ảnh',
      description: 'Chụp ảnh trước/sau mỗi khu vực để khách hàng theo dõi'
    },
    {
      step: '5',
      title: 'GPS Check-out',
      description: 'Check-out và gửi báo cáo hoàn thành kèm hình ảnh cho khách hàng'
    },
    {
      step: '6',
      title: 'Đánh giá',
      description: 'Khách hàng xem lại kết quả và đánh giá dịch vụ'
    }
  ];

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
            <div className="inline-flex items-center gap-2 bg-[#6366F1]/10 text-[#6366F1] px-3 py-1.5 rounded-full text-xs font-medium mb-4">
              <Home className="w-3 h-3" />
              Về HomeTask
            </div>
            <h1 className="text-2xl font-bold text-[#1A365D] mb-3 leading-tight">
              Quản lý dọn dẹp
              <span className="text-[#6366F1]"> chuyên nghiệp</span>
            </h1>
            <p className="text-gray-600 text-sm">
              Không chỉ kết nối, HomeTask quản lý toàn bộ quy trình thực hiện dịch vụ với checklist, GPS, hình ảnh và theo dõi thời gian thực
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-6 px-4 bg-white">
        <div className="max-w-full">
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center bg-gradient-to-br from-[#F0F4F8] to-[#E2E8F0] rounded-xl p-4"
                  data-vibe="reveal"
                  data-delay={index + 1}
                >
                  <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Icon className="w-6 h-6 text-[#6366F1]" />
                  </div>
                  <div className="text-2xl font-bold text-[#1A365D] mb-1">{stat.number}</div>
                  <div className="text-gray-600 text-xs">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-6 px-4 bg-[#F0F4F8]">
        <div className="max-w-full">
          <div className="text-center mb-5" data-vibe="reveal">
            <h2 className="text-xl font-bold text-[#1A365D] mb-2">
              Hệ thống quản lý thông minh
            </h2>
            <p className="text-gray-600 text-sm">
              4 công nghệ cốt lõi giúp minh bạch hóa quy trình
            </p>
          </div>

          <div className="space-y-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-5 shadow-sm"
                  data-vibe="reveal"
                  data-delay={index + 1}
                >
                  <div className="flex items-start gap-3">
                    <div className={`${feature.color} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-[#1A365D] mb-1">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed text-sm">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-6 px-4 bg-white">
        <div className="max-w-full">
          <div className="text-center mb-5" data-vibe="reveal">
            <h2 className="text-xl font-bold text-[#1A365D] mb-2">
              Quy trình làm việc
            </h2>
            <p className="text-gray-600 text-sm">
              6 bước đơn giản, minh bạch từ đầu đến cuối
            </p>
          </div>

          <div className="space-y-4">
            {howItWorks.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="flex gap-3 items-start"
                data-vibe="reveal"
                data-delay={index + 1}
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#6366F1] to-[#4F46E5] text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {item.step}
                </div>
                <div className="flex-1 bg-[#F0F4F8] rounded-xl p-4">
                  <h3 className="text-base font-bold text-[#1A365D] mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-10 px-4 bg-gradient-to-br from-[#1A365D] to-[#2C5282] mx-4 rounded-2xl my-6">
        <div className="max-w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Target className="w-12 h-12 text-white mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-3">
              Sứ mệnh của chúng tôi
            </h2>
            <p className="text-[#E2E8F0] text-sm leading-relaxed">
              HomeTask không chỉ kết nối cung - cầu mà còn quản lý toàn bộ quy trình thực hiện dịch vụ. 
              Chúng tôi minh bạch hóa quy trình làm việc, nâng cao khả năng kiểm soát chất lượng và 
              giảm thiểu tranh chấp giữa các bên thông qua công nghệ.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-6 px-4 bg-white">
        <div className="max-w-full">
          <div className="text-center mb-5" data-vibe="reveal">
            <h2 className="text-xl font-bold text-[#1A365D] mb-2">
              Giá trị cốt lõi
            </h2>
            <p className="text-gray-600 text-sm">
              Những lợi ích mà HomeTask mang lại
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-gradient-to-br from-[#F0F4F8] to-white rounded-2xl p-4"
                  data-vibe="reveal"
                  data-delay={index + 1}
                >
                  <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-sm">
                    <Icon className="w-5 h-5 text-[#6366F1]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1A365D] mb-2">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-xs">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-10 px-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white mx-4 rounded-2xl my-6">
        <div className="max-w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-bold mb-3">
              Liên hệ với chúng tôi
            </h2>
            <p className="text-gray-300 text-sm mb-6">
              Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7
            </p>

            <div className="space-y-3">
              <a href="tel:1900-1234" className="flex items-center gap-3 bg-white/10 rounded-xl p-4 hover:bg-white/20 transition-colors">
                <div className="bg-[#1A365D] w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-sm">Hotline</h3>
                  <p className="text-gray-300 text-sm">1900 1234</p>
                </div>
              </a>

              <a href="mailto:support@hometask.vn" className="flex items-center gap-3 bg-white/10 rounded-xl p-4 hover:bg-white/20 transition-colors">
                <div className="bg-[#2C5282] w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-sm">Email</h3>
                  <p className="text-gray-300 text-sm">support@hometask.vn</p>
                </div>
              </a>

              <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
                <div className="bg-[#6366F1] w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-sm">Chat support</h3>
                  <p className="text-gray-300 text-sm">Trong ứng dụng</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
