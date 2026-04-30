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
