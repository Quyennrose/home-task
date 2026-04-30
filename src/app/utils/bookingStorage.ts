import { Booking } from '@/app/data/mockData';

const BOOKINGS_STORAGE_KEY = 'hometask_bookings';
const BOOKING_PROGRESS_STORAGE_KEY = 'hometask_booking_progress';

export type BookingInput = Omit<Booking, 'id' | 'createdAt' | 'status'> & {
  status?: Booking['status'];
};

export interface BookingLocation {
  latitude: number;
  longitude: number;
  capturedAt: string;
  distanceMeters?: number;
  withinAllowedRadius?: boolean;
}

export interface BookingChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface BookingProgress {
  bookingId: string;
  checklist: BookingChecklistItem[];
  checkIn?: BookingLocation;
  checkOut?: BookingLocation;
  photoConfirmation?: {
    name: string;
    dataUrl?: string;
    capturedAt: string;
  };
  updatedAt: string;
}

const defaultChecklistLabels = [
  'Check-in đúng địa điểm',
  'Vệ sinh khu vực chính',
  'Vệ sinh bếp và toilet',
  'Thu gom rác và sắp xếp lại đồ dùng',
  'Chụp ảnh xác nhận kết quả',
];

function readStoredBookings(): Booking[] {
  const rawBookings = localStorage.getItem(BOOKINGS_STORAGE_KEY);
  if (!rawBookings) {
    return [];
  }

  try {
    const parsedBookings = JSON.parse(rawBookings);
    return Array.isArray(parsedBookings) ? parsedBookings : [];
  } catch {
    localStorage.removeItem(BOOKINGS_STORAGE_KEY);
    return [];
  }
}

function writeStoredBookings(bookings: Booking[]) {
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
}

function createDefaultProgress(bookingId: string): BookingProgress {
  return {
    bookingId,
    checklist: defaultChecklistLabels.map((label, index) => ({
      id: `task_${index + 1}`,
      label,
      completed: false,
    })),
    updatedAt: new Date().toISOString(),
  };
}

function readStoredProgress(): Record<string, BookingProgress> {
  const rawProgress = localStorage.getItem(BOOKING_PROGRESS_STORAGE_KEY);
  if (!rawProgress) {
    return {};
  }

  try {
    const parsedProgress = JSON.parse(rawProgress);
    return parsedProgress && typeof parsedProgress === 'object' ? parsedProgress : {};
  } catch {
    localStorage.removeItem(BOOKING_PROGRESS_STORAGE_KEY);
    return {};
  }
}

function writeStoredProgress(progressByBookingId: Record<string, BookingProgress>) {
  localStorage.setItem(BOOKING_PROGRESS_STORAGE_KEY, JSON.stringify(progressByBookingId));
}

export function getBookingsByCustomerId(customerId?: string): Booking[] {
  if (!customerId) {
    return [];
  }

  return readStoredBookings()
    .filter((booking) => booking.customerId === customerId)
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();
      return dateB - dateA;
    });
}

export function getAllStoredBookings(): Booking[] {
  return readStoredBookings()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getBookingsByHelperId(helperId?: string): Booking[] {
  if (!helperId) {
    return [];
  }

  return readStoredBookings()
    .filter((booking) => booking.helperId === helperId)
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();
      return dateA - dateB;
    });
}

export function createBooking(input: BookingInput): Booking {
  const booking: Booking = {
    ...input,
    id: `booking_${Date.now()}`,
    status: input.status ?? 'pending',
    paymentStatus: input.paymentStatus ?? 'unpaid',
    createdAt: new Date().toISOString(),
  };

  writeStoredBookings([booking, ...readStoredBookings()]);
  updateBookingProgress(booking.id, (progress) => progress);
  return booking;
}

export function updateBookingStatus(bookingId: string, status: Booking['status']) {
  const bookings = readStoredBookings();
  writeStoredBookings(bookings.map((booking) => (
    booking.id === bookingId ? { ...booking, status } : booking
  )));
}

export function updateBookingPaymentStatus(bookingId: string, paymentStatus: Booking['paymentStatus']) {
  const bookings = readStoredBookings();
  writeStoredBookings(bookings.map((booking) => (
    booking.id === bookingId ? { ...booking, paymentStatus } : booking
  )));
}

export function getBookingProgress(bookingId: string): BookingProgress {
  const progressByBookingId = readStoredProgress();
  return progressByBookingId[bookingId] ?? createDefaultProgress(bookingId);
}

export function updateBookingProgress(
  bookingId: string,
  update: (progress: BookingProgress) => BookingProgress
) {
  const progressByBookingId = readStoredProgress();
  const nextProgress = {
    ...update(progressByBookingId[bookingId] ?? createDefaultProgress(bookingId)),
    bookingId,
    updatedAt: new Date().toISOString(),
  };

  writeStoredProgress({
    ...progressByBookingId,
    [bookingId]: nextProgress,
  });

  return nextProgress;
}

export function getBookingCompletionPercent(progress: BookingProgress) {
  if (progress.checklist.length === 0) {
    return 0;
  }

  const completedTasks = progress.checklist.filter((item) => item.completed).length;
  return Math.round((completedTasks / progress.checklist.length) * 100);
}

export function formatBookingStatus(status: Booking['status']) {
  const labels: Record<Booking['status'], string> = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };

  return labels[status];
}
