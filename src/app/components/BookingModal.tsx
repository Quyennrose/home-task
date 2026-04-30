import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, MapPin, User, CheckCircle } from 'lucide-react';
import { Booking } from '@/app/data/mockData';
import { useAuth } from '@/app/contexts/AuthContext';
import { getApiErrorMessage } from '@/app/services/apiClient';
import { localApi } from '@/app/utils/localApi';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: string;
  helperName?: string;
  helperId?: string;
  hourlyRate?: number;
  onBookingCreated?: (booking: Booking) => void;
}

const initialBookingFormData = {
  date: '',
  time: '',
  address: '',
  hours: '2',
  notes: '',
};

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

const getTodayInputValue = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localDate = new Date(today.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split('T')[0];
};

export function BookingModal({
  isOpen,
  onClose,
  service = 'Dọn dẹp nhà',
  helperName,
  helperId = '',
  hourlyRate = 80000,
  onBookingCreated,
}: BookingModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState(initialBookingFormData);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const servicePrice = parseInt(formData.hours, 10) * hourlyRate;
  const travelFee = 20000;
  const totalPrice = servicePrice + travelFee;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      const booking = await localApi.bookings.create({
        customerId: user?.id ?? 'guest',
        helperId,
        helperName: helperName || 'Chưa chọn nhân viên',
        service,
        date: formData.date,
        time: formData.time,
        hours: parseInt(formData.hours, 10),
        address: formData.address.trim(),
        totalPrice,
        notes: formData.notes.trim() || undefined,
      });

      onBookingCreated?.(booking);
      await localApi.notifications.create({
        userId: booking.customerId,
        title: 'Đã tạo lịch đặt',
        message: `${booking.service} vào ${new Date(booking.date).toLocaleDateString('vi-VN')} lúc ${booking.time}.`,
      });

      if (booking.helperId) {
        await localApi.notifications.create({
          userId: booking.helperId,
          title: 'Bạn có lịch đặt mới',
          message: `${booking.service} vào ${new Date(booking.date).toLocaleDateString('vi-VN')} lúc ${booking.time}.`,
        });
      }

      setFormData(initialBookingFormData);
      setIsSubmitted(true);
    } catch (nextError) {
      setError(getApiErrorMessage(nextError));
    }
  };

  const handleClose = () => {
    setIsSubmitted(false);
    setError('');
    onClose();
  };

  const handleCancel = () => {
    setFormData(initialBookingFormData);
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-gray-900 text-2xl font-semibold">Đặt lịch dịch vụ</h2>
                  {service && <p className="text-blue-600 text-sm mt-1">{service}</p>}
                  {helperName && (
                    <p className="text-gray-600 text-sm flex items-center gap-1 mt-1">
                      <User className="w-3 h-3" />
                      {helperName}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleClose}
                  type="button"
                  aria-label="Đóng"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {isSubmitted ? (
                <div className="p-6 space-y-5 text-center">
                  <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Đặt lịch thành công</h3>
                    <p className="text-gray-600 text-sm mt-2">
                      HomeTask đã ghi nhận yêu cầu và sẽ cập nhật trạng thái trong danh sách lịch.
                    </p>
                  </div>
                  <button
                    data-testid="booking-success-done"
                    type="button"
                    onClick={handleClose}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                  >
                    Hoàn tất
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="text-gray-700 font-medium mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Ngày làm việc
                    </label>
                    <input
                      data-testid="booking-date"
                      type="date"
                      required
                      value={formData.date}
                      onChange={(event) => setFormData({ ...formData, date: event.target.value })}
                      min={getTodayInputValue()}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="text-gray-700 font-medium mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Giờ bắt đầu
                    </label>
                    <input
                      data-testid="booking-time"
                      type="time"
                      required
                      value={formData.time}
                      onChange={(event) => setFormData({ ...formData, time: event.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Số giờ làm việc</label>
                    <select
                      data-testid="booking-hours"
                      value={formData.hours}
                      onChange={(event) => setFormData({ ...formData, hours: event.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="2">2 giờ</option>
                      <option value="3">3 giờ</option>
                      <option value="4">4 giờ</option>
                      <option value="6">6 giờ</option>
                      <option value="8">8 giờ</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-700 font-medium mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      Địa chỉ
                    </label>
                    <input
                      data-testid="booking-address"
                      type="text"
                      required
                      value={formData.address}
                      onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                      placeholder="Nhập địa chỉ của bạn"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Ghi chú tùy chọn</label>
                    <textarea
                      value={formData.notes}
                      onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
                      placeholder="Thêm yêu cầu đặc biệt..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Giá dịch vụ ({formData.hours}h)</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(servicePrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Phí di chuyển</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(travelFee)}</span>
                    </div>
                    <div className="border-t border-blue-200 pt-2 flex justify-between">
                      <span className="font-semibold text-gray-900">Tổng cộng</span>
                      <span className="font-bold text-blue-600 text-lg">{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      data-testid="booking-submit"
                      type="submit"
                      className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                    >
                      Xác nhận
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
