import { ChangeEvent, useState } from 'react';
import { Camera, CheckCircle, ClipboardCheck, Clock, Loader2, MapPin } from 'lucide-react';
import { BookingChat } from '@/app/components/BookingChat';
import { appConfig } from '@/app/config/appConfig';
import { Booking } from '@/app/data/mockData';
import {
  BookingProgress,
  formatBookingStatus,
  getBookingCompletionPercent,
  getBookingProgress,
} from '@/app/utils/bookingStorage';
import { checkBookingDistance, formatDistance } from '@/app/utils/geoUtils';
import { localApi } from '@/app/utils/localApi';

interface HelperJobCardProps {
  booking: Booking;
  onBookingUpdated?: () => void;
}

type LocationStep = 'checkIn' | 'checkOut';

function formatLocation(progress?: { latitude: number; longitude: number; capturedAt: string }) {
  if (!progress) {
    return 'Chưa ghi nhận';
  }

  return `${progress.latitude.toFixed(5)}, ${progress.longitude.toFixed(5)}`;
}

function formatLocationDistance(progress?: { distanceMeters?: number; withinAllowedRadius?: boolean }) {
  if (typeof progress?.distanceMeters !== 'number') {
    return 'Chưa kiểm tra khoảng cách';
  }

  return `${formatDistance(progress.distanceMeters)} - ${progress.withinAllowedRadius ? 'hợp lệ' : 'cần kiểm tra lại'}`;
}

function captureCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function HelperJobCard({ booking, onBookingUpdated }: HelperJobCardProps) {
  const [progress, setProgress] = useState<BookingProgress>(() => getBookingProgress(booking.id));
  const [locatingStep, setLocatingStep] = useState<LocationStep | null>(null);
  const [locationError, setLocationError] = useState('');

  const completionPercent = getBookingCompletionPercent(progress);
  const isAccepted = booking.status === 'confirmed';
  const isClosed = booking.status === 'completed' || booking.status === 'cancelled';
  const canCheckIn = isAccepted && !progress.checkIn && !isClosed;
  const canCheckOut = Boolean(progress.checkIn) && completionPercent === 100 && !progress.checkOut && !isClosed;

  const handleStatusChange = async (status: Booking['status']) => {
    await localApi.bookings.updateStatus(booking.id, status);
    await localApi.notifications.create({
      userId: booking.customerId,
      title: status === 'confirmed' ? 'Người giúp việc đã nhận lịch' : 'Lịch đã bị từ chối',
      message: status === 'confirmed'
        ? `${booking.helperName} đã nhận lịch ${booking.service}.`
        : `${booking.helperName} đã từ chối lịch ${booking.service}.`,
    });
    onBookingUpdated?.();
  };

  const handleGpsCapture = async (step: LocationStep) => {
    setLocatingStep(step);
    setLocationError('');

    try {
      const position = await captureCurrentPosition();
      const geoCheck = checkBookingDistance(booking, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const nextProgress = await localApi.bookings.updateProgress(booking.id, (currentProgress) => ({
        ...currentProgress,
        [step]: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          capturedAt: new Date().toISOString(),
          distanceMeters: geoCheck.distanceMeters,
          withinAllowedRadius: geoCheck.withinAllowedRadius,
        },
      }));

      setProgress(nextProgress);
      await localApi.bookings.updateStatus(booking.id, step === 'checkIn' ? 'confirmed' : 'completed');
      await localApi.notifications.create({
        userId: booking.customerId,
        title: step === 'checkIn' ? 'Đã check-in GPS' : 'Dịch vụ đã hoàn thành',
        message: step === 'checkIn'
          ? `${booking.helperName} đã bắt đầu công việc.`
          : `${booking.helperName} đã check-out và hoàn thành công việc.`,
      });
      onBookingUpdated?.();
    } catch {
      setLocationError('Không lấy được GPS. Hãy bật quyền vị trí của trình duyệt rồi thử lại.');
    } finally {
      setLocatingStep(null);
    }
  };

  const handleChecklistToggle = async (taskId: string) => {
    const nextProgress = await localApi.bookings.updateProgress(booking.id, (currentProgress) => ({
      ...currentProgress,
      checklist: currentProgress.checklist.map((item) => (
        item.id === taskId ? { ...item, completed: !item.completed } : item
      )),
    }));

    setProgress(nextProgress);
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    const nextProgress = await localApi.bookings.updateProgress(booking.id, (currentProgress) => ({
      ...currentProgress,
      photoConfirmation: {
        name: file.name,
        dataUrl,
        capturedAt: new Date().toISOString(),
      },
      checklist: currentProgress.checklist.map((item) => (
        item.label === 'Chụp ảnh xác nhận kết quả' ? { ...item, completed: true } : item
      )),
    }));

    setProgress(nextProgress);
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold text-[#1A365D] text-sm">{booking.service}</h3>
          <p className="text-xs text-gray-600 mt-1">{booking.hours} giờ - {booking.totalPrice.toLocaleString('vi-VN')} đ</p>
        </div>
        <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-semibold whitespace-nowrap">
          {formatBookingStatus(booking.status)}
        </span>
      </div>

      <div className="space-y-2 text-xs text-gray-600 mb-4">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#6366F1]" />
          <span>{new Date(booking.date).toLocaleDateString('vi-VN')} lúc {booking.time}</span>
        </div>
        <div className="flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#6366F1] mt-0.5 flex-shrink-0" />
          <span>{booking.address}</span>
        </div>
        {booking.notes && (
          <div className="flex items-start gap-1.5">
            <ClipboardCheck className="w-3.5 h-3.5 text-[#6366F1] mt-0.5 flex-shrink-0" />
            <span>{booking.notes}</span>
          </div>
        )}
      </div>

      <div className="bg-[#F0F4F8] rounded-xl p-3 mb-4">
        <div className="flex justify-between text-xs font-medium text-[#1A365D] mb-2">
          <span>Tiến độ checklist</span>
          <span>{completionPercent}%</span>
        </div>
        <div className="h-2 bg-white rounded-full overflow-hidden">
          <div className="h-full bg-[#6366F1]" style={{ width: `${completionPercent}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          type="button"
          onClick={() => handleGpsCapture('checkIn')}
          disabled={!canCheckIn || locatingStep !== null}
          className="px-3 py-2 bg-[#6366F1] disabled:bg-gray-300 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
        >
          {locatingStep === 'checkIn' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
          Check-in GPS
        </button>
        <button
          type="button"
          onClick={() => handleGpsCapture('checkOut')}
          disabled={!canCheckOut || locatingStep !== null}
          className="px-3 py-2 bg-[#1A365D] disabled:bg-gray-300 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
        >
          {locatingStep === 'checkOut' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
          Check-out
        </button>
      </div>

      {locationError && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2 mb-4">{locationError}</p>
      )}

      {booking.status === 'pending' && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            data-testid={`helper-accept-${booking.id}`}
            type="button"
            onClick={() => handleStatusChange('confirmed')}
            className="px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-semibold"
          >
            Nhận việc
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange('cancelled')}
            className="px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-semibold"
          >
            Từ chối
          </button>
        </div>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Check-in: {formatLocation(progress.checkIn)}</span>
        </div>
        {progress.checkIn && (
          <div className="text-xs text-gray-600">
            Khoảng cách check-in: {formatLocationDistance(progress.checkIn)}
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Check-out: {formatLocation(progress.checkOut)}</span>
        </div>
        {progress.checkOut && (
          <div className="text-xs text-gray-600">
            Khoảng cách check-out: {formatLocationDistance(progress.checkOut)}
          </div>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {progress.checklist.map((item) => (
          <label key={item.id} className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => handleChecklistToggle(item.id)}
              disabled={!isAccepted || isClosed}
              className="mt-1 w-4 h-4 text-[#6366F1] rounded border-gray-300"
            />
            <span className={item.completed ? 'line-through text-gray-400' : ''}>{item.label}</span>
          </label>
        ))}
      </div>

      <label className="w-full px-3 py-2 border border-[#6366F1] text-[#6366F1] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
        <Camera className="w-3.5 h-3.5" />
        {progress.photoConfirmation ? progress.photoConfirmation.name : 'Thêm ảnh xác nhận'}
        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={!isAccepted || isClosed} />
      </label>

      {progress.photoConfirmation?.dataUrl && (
        <img
          src={progress.photoConfirmation.dataUrl}
          alt="Ảnh xác nhận kết quả"
          className="mt-3 w-full h-40 object-cover rounded-xl border border-gray-100"
        />
      )}

      {progress.photoConfirmation?.dataUrl && !appConfig.capabilities.persistentUploads && (
        <p className="text-[11px] text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-2">
          Ảnh đang lưu local trong trình duyệt. Cấu hình VITE_UPLOAD_PROVIDER để lưu ảnh bền vững trên storage thật.
        </p>
      )}

      {booking.status === 'pending' && (
        <p className="text-[11px] text-gray-500 mt-3">
          Hãy nhận việc trước khi check-in GPS và bắt đầu checklist.
        </p>
      )}

      {!canCheckOut && !progress.checkOut && booking.status !== 'pending' && !isClosed && (
        <p className="text-[11px] text-gray-500 mt-3">
          Cần check-in GPS và hoàn thành 100% checklist trước khi check-out.
        </p>
      )}
      <div className="mt-4">
        <BookingChat booking={booking} />
      </div>
    </div>
  );
}
