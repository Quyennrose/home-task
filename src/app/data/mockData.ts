export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  userType: 'customer' | 'helper' | 'admin';
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface HelperProfile extends User {
  userType: 'helper';
  service: string;
  applicationStatus?: 'draft' | 'pending' | 'approved' | 'rejected';
  rating: number;
  reviewsCount: number;
  experience: string;
  location: string;
  verified: boolean;
  imageUrl: string;
  bio: string;
  skills: string[];
  certifications: string[];
  hourlyRate: number;
  availability: string[];
  completedJobs: number;
  idNumber?: string;
  serviceAreas?: string[];
  bankName?: string;
  bankAccount?: string;
  identityDocumentName?: string;
  applicationNote?: string;
  submittedAt?: string;
}

export interface CustomerProfile extends User {
  userType: 'customer';
  preferences: string[];
  favoriteHelpers: string[];
}

export interface AdminProfile extends User {
  userType: 'admin';
  role: 'operations';
}

export interface Review {
  id: string;
  helperId: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  service: string;
  date: string;
  images?: string[];
}

export interface Booking {
  id: string;
  customerId: string;
  helperId: string;
  helperName: string;
  service: string;
  date: string;
  time: string;
  hours: number;
  address: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus?: 'unpaid' | 'paid';
  totalPrice: number;
  createdAt: string;
  notes?: string;
}

// Mock Helpers Data - Only cleaning service
export const mockHelpers: HelperProfile[] = [
  {
    id: '3',
    name: 'Chị Thu Hà',
    email: 'thuha@example.com',
    userType: 'helper',
    applicationStatus: 'approved',
    service: 'Dọn dẹp nhà',
    rating: 4.8,
    reviewsCount: 156,
    experience: '2 năm',
    location: 'Quận Hải Châu, Đà Nẵng',
    verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400',
    bio: 'Chuyên vệ sinh nhà cửa, văn phòng với nhiều năm kinh nghiệm. Tôi làm việc nhanh gọn, sạch sẽ và tỉ mỉ với checklist đầy đủ.',
    skills: ['Vệ sinh tổng thể', 'Giặt ủi', 'Lau kính cao tầng', 'Vệ sinh máy lạnh'],
    certifications: ['Chứng chỉ vệ sinh công nghiệp'],
    hourlyRate: 80000,
    availability: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'],
    completedJobs: 312,
    phone: '0903456789',
    address: 'Quận Hải Châu, Đà Nẵng',
    createdAt: '2024-03-05'
  },
  {
    id: '6',
    name: 'Chị Thanh Hương',
    email: 'thanhhuong@example.com',
    userType: 'helper',
    service: 'Dọn dẹp nhà',
    rating: 4.9,
    reviewsCount: 201,
    experience: '2 năm 6 tháng',
    location: 'Quận Thanh Khê, Đà Nẵng',
    verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
    bio: 'Tôi có nhiều năm kinh nghiệm trong lĩnh vực vệ sinh và dọn dẹp. Tôi làm việc chuyên nghiệp, nhanh chóng và luôn đảm bảo chất lượng tốt nhất với xác nhận hình ảnh.',
    skills: ['Vệ sinh tổng thể', 'Giặt ủi cao cấp', 'Tổ chức không gian', 'Vệ sinh bếp chuyên sâu'],
    certifications: ['Chứng chỉ quản gia chuyên nghiệp', 'Chứng chỉ vệ sinh công nghiệp'],
    hourlyRate: 80000,
    availability: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'],
    completedJobs: 445,
    phone: '0906789012',
    address: 'Quận Thanh Khê, Đà Nẵng',
    createdAt: '2024-01-10'
  },
  {
    id: '7',
    name: 'Chị Phương Linh',
    email: 'phuonglinh@example.com',
    userType: 'helper',
    service: 'Dọn dẹp nhà',
    rating: 4.9,
    reviewsCount: 178,
    experience: '1 năm 8 tháng',
    location: 'Quận Sơn Trà, Đà Nẵng',
    verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    bio: 'Chuyên nghiệp trong vệ sinh và dọn dẹp. Tôi sử dụng công nghệ GPS để check-in/check-out và xác nhận công việc bằng hình ảnh.',
    skills: ['Vệ sinh sàn gỗ', 'Vệ sinh sofa', 'Giặt rèm cửa', 'Vệ sinh kính chuyên nghiệp'],
    certifications: ['Chứng chỉ vệ sinh công nghiệp', 'Chứng chỉ an toàn lao động'],
    hourlyRate: 80000,
    availability: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'],
    completedJobs: 289,
    phone: '0907890123',
    address: 'Quận Sơn Trà, Đà Nẵng',
    createdAt: '2024-02-15'
  },
  {
    id: '8',
    name: 'Anh Quang Minh',
    email: 'quangminh@example.com',
    userType: 'helper',
    service: 'Dọn dẹp nhà',
    rating: 4.7,
    reviewsCount: 134,
    experience: '2 năm 2 tháng',
    location: 'Quận Cẩm Lệ, Đà Nẵng',
    verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    bio: 'Làm việc theo checklist chi tiết, đảm bảo không bỏ sót công việc. Luôn xác nhận với khách hàng qua hình ảnh trước và sau khi làm.',
    skills: ['Vệ sinh công nghiệp', 'Vệ sinh sau xây dựng', 'Đánh bóng sàn', 'Vệ sinh mái kính'],
    certifications: ['Chứng chỉ vệ sinh công nghiệp cao cấp'],
    hourlyRate: 80000,
    availability: ['Thứ 3', 'Thứ 5', 'Thứ 7', 'CN'],
    completedJobs: 198,
    phone: '0908901234',
    address: 'Quận Cẩm Lệ, Đà Nẵng',
    createdAt: '2024-03-20'
  }
];

// Mock Reviews Data - Only for cleaning service
export const mockReviews: Review[] = [
  {
    id: 'r6',
    helperId: '3',
    customerId: 'c6',
    customerName: 'Chị Phương Anh',
    customerAvatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
    rating: 5,
    comment: 'Nhà tôi được dọn dẹp rất sạch sẽ và gọn gàng. Chị Thu Hà làm việc theo checklist rất chi tiết và gửi hình xác nhận cho tôi. Tôi rất hài lòng!',
    service: 'Dọn dẹp nhà',
    date: '2026-03-30',
    images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400']
  },
  {
    id: 'r7',
    helperId: '3',
    customerId: 'c7',
    customerName: 'Anh Quang Huy',
    rating: 5,
    comment: 'Dịch vụ tốt, giá cả hợp lý. Chị làm việc rất tỉ mỉ và sạch sẽ. Hệ thống checklist giúp tôi kiểm tra công việc dễ dàng.',
    service: 'Dọn dẹp nhà',
    date: '2026-03-22'
  },
  {
    id: 'r11',
    helperId: '6',
    customerId: 'c11',
    customerName: 'Anh Minh Khang',
    customerAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    rating: 5,
    comment: 'Chị Thanh Hương làm việc rất chuyên nghiệp. Nhà tôi luôn sạch sẽ và thơm tho. GPS tracking giúp tôi biết chính xác thời gian làm việc.',
    service: 'Dọn dẹp nhà',
    date: '2026-03-29'
  },
  {
    id: 'r12',
    helperId: '6',
    customerId: 'c12',
    customerName: 'Chị Thanh Thảo',
    rating: 5,
    comment: 'Rất hài lòng với dịch vụ. Chị làm việc tỉ mỉ, có hình ảnh xác nhận từng công đoạn. Rất minh bạch!',
    service: 'Dọn dẹp nhà',
    date: '2026-03-16'
  },
  {
    id: 'r13',
    helperId: '7',
    customerId: 'c13',
    customerName: 'Anh Tuấn Việt',
    rating: 5,
    comment: 'Chị Phương Linh làm việc rất nhanh và sạch. Checklist đầy đủ, xác nhận GPS và hình ảnh giúp tôi yên tâm khi không ở nhà.',
    service: 'Dọn dẹp nhà',
    date: '2026-04-01'
  },
  {
    id: 'r14',
    helperId: '7',
    customerId: 'c14',
    customerName: 'Chị Mai Phương',
    customerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    rating: 5,
    comment: 'Dịch vụ tuyệt vời! Hệ thống quản lý công việc của HomeTask rất chuyên nghiệp, giúp tôi theo dõi tiến độ theo thời gian thực.',
    service: 'Dọn dẹp nhà',
    date: '2026-03-25'
  },
  {
    id: 'r15',
    helperId: '8',
    customerId: 'c15',
    customerName: 'Chị Hương Giang',
    rating: 5,
    comment: 'Anh Minh làm việc rất tỉ mỉ, checklist đầy đủ từng bước. Tôi nhận được thông báo và hình ảnh xác nhận mỗi công đoạn.',
    service: 'Dọn dẹp nhà',
    date: '2026-03-28'
  },
  {
    id: 'r16',
    helperId: '8',
    customerId: 'c16',
    customerName: 'Anh Đức Thành',
    customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    rating: 5,
    comment: 'Rất ưng ý với dịch vụ. GPS tracking giúp tôi biết chính xác thời gian làm việc, không lo bị gian lận.',
    service: 'Dọn dẹp nhà',
    date: '2026-03-18'
  }
];

// Mock Bookings Data - Only cleaning service
export const mockBookings: Booking[] = [
  {
    id: 'b1',
    customerId: 'c6',
    helperId: '3',
    helperName: 'Chị Thu Hà',
    service: 'Dọn dẹp nhà',
    date: '2026-03-30',
    time: '08:00',
    hours: 4,
    address: '123 Nguyễn Văn Linh, Quận Hải Châu, Đà Nẵng',
    status: 'completed',
    totalPrice: 320000,
    createdAt: '2026-03-28'
  },
  {
    id: 'b2',
    customerId: 'c11',
    helperId: '6',
    helperName: 'Chị Thanh Hương',
    service: 'Dọn dẹp nhà',
    date: '2026-04-05',
    time: '09:00',
    hours: 3,
    address: '456 Lê Duẩn, Quận Thanh Khê, Đà Nẵng',
    status: 'confirmed',
    totalPrice: 240000,
    createdAt: '2026-04-01'
  },
  {
    id: 'b3',
    customerId: 'c13',
    helperId: '7',
    helperName: 'Chị Phương Linh',
    service: 'Dọn dẹp nhà',
    date: '2026-04-01',
    time: '14:00',
    hours: 5,
    address: '789 Ngô Quyền, Quận Sơn Trà, Đà Nẵng',
    status: 'completed',
    totalPrice: 400000,
    createdAt: '2026-03-29'
  }
];

// Get reviews by helper ID
export function getReviewsByHelperId(helperId: string): Review[] {
  return mockReviews.filter(review => review.helperId === helperId);
}

// Get helper by ID
export function getHelperById(id: string): HelperProfile | undefined {
  return mockHelpers.find(helper => helper.id === id);
}

// Get helpers by service
export function getHelpersByService(service: string): HelperProfile[] {
  return mockHelpers.filter(helper => helper.service === service);
}
