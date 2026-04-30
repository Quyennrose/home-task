import { expect, test } from '@playwright/test';

test.describe('authentication flows', () => {
  test('renders the login screen with demo actions', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'HomeTask' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
    await expect(page.getByPlaceholder('email@example.com')).toBeVisible();
    await expect(page.getByTestId('login-helper-demo')).toBeVisible();
    await expect(page.getByTestId('login-admin-demo')).toBeVisible();
  });

  test('allows a demo helper to open the jobs workspace', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('login-helper-demo').click();

    await expect(page).toHaveURL(/\/helper\/jobs$/);
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('allows a demo admin to open helper applications', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('login-admin-demo').click();

    await expect(page).toHaveURL(/\/admin\/applications$/);
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});

test.describe('core HomeTask workflows', () => {
  test('allows a customer to create a booking from the home screen', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('email@example.com').fill('customer.demo@hometask.vn');
    await page.getByPlaceholder('••••••••').fill('customer123');
    await page.getByTestId('login-email-submit').click();

    await expect(page).toHaveURL(/\/home$/);
    await page.getByTestId('home-book-service').click();

    await page.getByTestId('booking-date').fill('2026-05-05');
    await page.getByTestId('booking-time').fill('09:00');
    await page.getByTestId('booking-hours').selectOption('3');
    await page.getByTestId('booking-address').fill('123 Nguyen Van Linh, Hai Chau, Da Nang');
    await page.getByTestId('booking-submit').click();

    await expect(page.getByText('Đặt lịch thành công')).toBeVisible();
    await page.getByTestId('booking-success-done').click();
    await expect(page.getByText('Lịch đặt gần đây')).toBeVisible();
  });

  test('allows a helper to accept a pending job', async ({ page }) => {
    await page.addInitScript(() => {
      const helper = {
        id: '3',
        name: 'Chị Thu Hà',
        email: 'helper.demo@hometask.vn',
        userType: 'helper',
        applicationStatus: 'approved',
        service: 'Dọn dẹp nhà',
        rating: 4.8,
        reviewsCount: 156,
        experience: '2 năm',
        location: 'Quận Hải Châu, Đà Nẵng',
        verified: true,
        imageUrl: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400',
        bio: 'Demo helper',
        skills: ['Vệ sinh tổng thể'],
        certifications: [],
        hourlyRate: 80000,
        availability: ['Thứ 2'],
        completedJobs: 0,
        createdAt: '2026-04-30T00:00:00.000Z',
      };
      const booking = {
        id: 'booking_e2e_accept',
        customerId: 'customer_e2e',
        helperId: '3',
        helperName: 'Chị Thu Hà',
        service: 'Dọn dẹp nhà',
        date: '2026-05-06',
        time: '10:00',
        hours: 3,
        address: 'Hai Chau, Da Nang',
        status: 'pending',
        paymentStatus: 'unpaid',
        totalPrice: 260000,
        createdAt: '2026-04-30T00:00:00.000Z',
      };
      window.localStorage.setItem('hometask_user', JSON.stringify(helper));
      window.localStorage.setItem('hometask_bookings', JSON.stringify([booking]));
    });

    await page.goto('/helper/jobs');
    await expect(page.getByText('Dọn dẹp nhà')).toBeVisible();
    await page.getByTestId('helper-accept-booking_e2e_accept').click();

    await expect(page.getByText('Đã xác nhận')).toBeVisible();
  });

  test('allows an admin to approve a helper application', async ({ page }) => {
    await page.addInitScript(() => {
      const admin = {
        id: 'admin_demo',
        name: 'Quản trị HomeTask',
        email: 'admin@hometask.vn',
        userType: 'admin',
        role: 'operations',
        createdAt: '2026-04-30T00:00:00.000Z',
      };
      const application = {
        id: 'helper_application_e2e',
        name: 'Ứng viên Demo',
        email: 'candidate@example.com',
        userType: 'helper',
        applicationStatus: 'pending',
        service: 'Dọn dẹp nhà',
        rating: 0,
        reviewsCount: 0,
        experience: '1 năm',
        location: 'Đà Nẵng',
        verified: false,
        imageUrl: '',
        bio: 'Demo application',
        skills: ['Dọn dẹp'],
        certifications: [],
        hourlyRate: 80000,
        availability: ['Thứ 2'],
        completedJobs: 0,
        phone: '0900000000',
        serviceAreas: ['Hải Châu'],
        bankName: 'VCB',
        bankAccount: '0123456789',
        createdAt: '2026-04-30T00:00:00.000Z',
        submittedAt: '2026-04-30T00:00:00.000Z',
      };
      window.localStorage.setItem('hometask_user', JSON.stringify(admin));
      window.localStorage.setItem('hometask_helper_applications', JSON.stringify([application]));
    });

    await page.goto('/admin/applications');
    await expect(page.getByText('Ứng viên Demo')).toBeVisible();
    await page.getByTestId('admin-approve-helper_application_e2e').click();

    await expect(page.getByText('Đã duyệt')).toBeVisible();
  });
});
