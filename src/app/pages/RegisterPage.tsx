import { useState } from 'react';
import { motion } from 'motion/react';
import { Home, User, Mail, Phone, MapPin, FileText, Briefcase, Chrome } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router';

type UserType = 'customer' | 'helper';
const CLEANING_SERVICE = 'Dọn dẹp nhà';

const splitList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const [userType, setUserType] = useState<UserType>(searchParams.get('role') === 'helper' ? 'helper' : 'customer');
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Helper-specific fields
  const service = CLEANING_SERVICE;
  const [experience, setExperience] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [certifications, setCertifications] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [serviceAreas, setServiceAreas] = useState('');
  const [availableDays, setAvailableDays] = useState('Thứ 2, Thứ 3, Thứ 4, Thứ 5, Thứ 6');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [identityDocumentName, setIdentityDocumentName] = useState('');
  const [applicationNote, setApplicationNote] = useState('');

  // Customer-specific fields
  const [preferences, setPreferences] = useState('');

  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/home');
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (userType === 'helper') {
        await register({
          name,
          email,
          password,
          phone,
          address,
          userType: 'helper',
          service,
          applicationStatus: 'pending',
          experience,
          bio,
          skills: splitList(skills),
          certifications: splitList(certifications),
          rating: 0,
          reviewsCount: 0,
          location: address,
          verified: false,
          imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
          hourlyRate: 80000,
          availability: splitList(availableDays),
          completedJobs: 0,
          idNumber: idNumber.trim(),
          serviceAreas: splitList(serviceAreas),
          bankName: bankName.trim(),
          bankAccount: bankAccount.trim(),
          identityDocumentName,
          applicationNote: applicationNote.trim(),
          submittedAt: new Date().toISOString(),
        });
      } else {
        await register({
          name,
          email,
          password,
          phone,
          address,
          userType: 'customer',
          preferences: splitList(preferences),
          favoriteHelpers: []
        });
      }
      navigate(userType === 'helper' ? '/helper/profile' : '/home');
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-6 px-4 max-w-[430px] mx-auto">
      <div className="max-w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Home className="w-5 h-5" />
              </div>
              <h1 className="text-lg font-bold">HomeTask</h1>
            </div>
            <h2 className="text-2xl font-bold mb-1">
              {userType === 'helper' ? 'Nộp đơn người giúp việc' : 'Đăng ký tài khoản'}
            </h2>
            <p className="text-blue-100 text-sm">
              {userType === 'helper' ? 'Gửi hồ sơ để HomeTask xét duyệt và phân việc phù hợp' : 'Tham gia cộng đồng HomeTask ngay hôm nay'}
            </p>
          </div>

          <div className="p-6">
            {/* Google Register */}
            <button
              onClick={handleGoogleRegister}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 border-2 border-gray-300 hover:border-blue-600 rounded-xl font-medium text-gray-700 hover:text-blue-600 transition-all mb-5 disabled:opacity-50"
            >
              <Chrome className="w-5 h-5" />
              Đăng ký nhanh với Google
            </button>

            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Hoặc điền thông tin bên dưới</span>
              </div>
            </div>

            {/* User Type Selection */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-3 text-sm">Bạn đăng ký với vai trò:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('customer')}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    userType === 'customer'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <User className={`w-6 h-6 mb-2 ${userType === 'customer' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <h3 className="font-semibold text-gray-900 mb-1 text-xs">Tìm người giúp việc</h3>
                  <p className="text-[10px] text-gray-600">Đặt dịch vụ và tìm người phù hợp</p>
                </button>

                <button
                  type="button"
                  onClick={() => setUserType('helper')}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    userType === 'helper'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <Briefcase className={`w-6 h-6 mb-2 ${userType === 'helper' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <h3 className="font-semibold text-gray-900 mb-1 text-xs">Làm người giúp việc</h3>
                  <p className="text-[10px] text-gray-600">Tìm công việc và nhận lịch</p>
                </button>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Common Fields */}
              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">Họ và tên *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">Mat khau *</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Toi thieu 8 ky tu"
                    required
                    minLength={8}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">Số điện thoại *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912345678"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">Địa chỉ *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Quận, Thành phố"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Helper-specific Fields */}
              {userType === 'helper' && (
                <>
                  <div className="border-t border-gray-200 pt-5 mt-5">
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm">Hồ sơ ứng tuyển</h3>
                    <p className="text-xs text-gray-500 mb-4">Các thông tin này dùng để xác minh và phân lịch làm phù hợp.</p>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">Dịch vụ chuyên môn *</label>
                    <input
                      type="text"
                      value={service}
                      readOnly
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50 text-gray-700 text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">HomeTask hiện tập trung vào dịch vụ dọn dẹp nhà.</p>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">Kinh nghiệm *</label>
                    <input
                      type="text"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="VD: 5 năm"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">Số CCCD/CMND *</label>
                    <input
                      type="text"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder="VD: 048xxxxxxxxx"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">Giới thiệu bản thân *</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Giới thiệu ngắn gọn về kinh nghiệm và điểm mạnh của bạn..."
                      required
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">Khu vực nhận việc *</label>
                    <textarea
                      value={serviceAreas}
                      onChange={(e) => setServiceAreas(e.target.value)}
                      placeholder="VD: Hải Châu, Thanh Khê, Sơn Trà"
                      required
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">Lịch có thể làm *</label>
                    <textarea
                      value={availableDays}
                      onChange={(e) => setAvailableDays(e.target.value)}
                      placeholder="VD: Thứ 2, Thứ 4, Thứ 6, CN"
                      required
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">Kỹ năng (phân cách bằng dấu phẩy) *</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <textarea
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        placeholder="VD: Vệ sinh tổng thể, Giặt ủi, Lau kính, Vệ sinh bếp"
                        required
                        rows={2}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">Chứng chỉ (phân cách bằng dấu phẩy)</label>
                    <textarea
                      value={certifications}
                      onChange={(e) => setCertifications(e.target.value)}
                      placeholder="VD: Chứng chỉ vệ sinh công nghiệp, Chứng chỉ an toàn lao động"
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2 text-sm">Ngân hàng nhận tiền *</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="VD: Vietcombank"
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2 text-sm">Số tài khoản *</label>
                      <input
                        type="text"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        placeholder="VD: 0123456789"
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">Ảnh giấy tờ xác minh</label>
                    <label className="block w-full px-4 py-3 border border-dashed border-blue-300 bg-blue-50 rounded-xl text-sm text-blue-700 cursor-pointer">
                      {identityDocumentName || 'Chọn ảnh CCCD/CMND hoặc chứng chỉ'}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => setIdentityDocumentName(e.target.files?.[0]?.name ?? '')}
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">Ghi chú cho bộ phận duyệt hồ sơ</label>
                    <textarea
                      value={applicationNote}
                      onChange={(e) => setApplicationNote(e.target.value)}
                      placeholder="VD: Tôi có thể bắt đầu từ tuần sau, ưu tiên nhận ca buổi sáng..."
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    />
                  </div>
                </>
              )}

              {/* Customer-specific Fields */}
              {userType === 'customer' && (
                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">Yêu cầu đặc biệt (nếu có)</label>
                  <textarea
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    placeholder="VD: Cần dọn bếp kỹ, ưu tiên làm buổi sáng, mang theo dụng cụ vệ sinh..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                  />
                </div>
              )}

              <div className="flex items-start gap-2">
                <input type="checkbox" required className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5" />
                <label className="text-xs text-gray-600">
                  Tôi đồng ý với <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Điều khoản dịch vụ</a> và <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Chính sách bảo mật</a>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? 'Đang gửi...' : userType === 'helper' ? 'Gửi hồ sơ ứng tuyển' : 'Đăng ký tài khoản'}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-gray-600">
              Đã có tài khoản?{' '}
              <Link to="/" className="text-blue-600 hover:text-blue-700 font-semibold">
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
