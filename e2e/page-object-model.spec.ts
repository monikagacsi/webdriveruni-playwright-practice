import { test, expect } from '@playwright/test';

const PAGE_PATH = '/Page-Object-Model/index.html';

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE_PATH, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await expect(
    page.getByRole('link', { name: 'WebdriverUniversity.com (Page Object Model)' }),
  ).toBeVisible();
});

test.describe('Page Object Model home page', () => {
  test('shows the main navigation and page sections', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Home', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Our Products', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact Us', exact: true })).toBeVisible();

    await expect(page.getByText('Who Are We?', { exact: true })).toBeVisible();
    await expect(page.getByText('Why Choose Us?', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Find Out More!' })).toBeVisible();
  });

  test('moves the carousel forward and backward', async ({ page }) => {
    const carousel = page.locator('#carousel-example-generic');
    const activeSlide = carousel.locator('.carousel-inner .item.active img');

    await expect(activeSlide).toHaveAttribute('src', /amp\.svg$/);

    await carousel.locator('a[data-slide="next"]').click();
    await expect(activeSlide).toHaveAttribute('src', /boombox\.svg$/);

    await carousel.locator('a[data-slide="prev"]').click();
    await expect(activeSlide).toHaveAttribute('src', /amp\.svg$/);
  });

  for (const closeButton of ['Close', '×', 'Find Out More']) {
    test(`opens and dismisses the modal with ${closeButton}`, async ({ page }) => {
      const modal = page.getByRole('dialog');
      await expect(modal).toBeHidden();

      await page.getByRole('button', { name: 'Find Out More!' }).click();
      await expect(modal).toBeVisible();
      await expect(modal).toContainText('Welcome to webdriveruniversity.com');
      await expect(modal).toContainText('a wide range of electrical goods');

      await modal.getByRole('button', { name: closeButton, exact: true }).click();
      await expect(modal).toBeHidden();
    });
  }

  test('navigates to Our Products', async ({ page }) => {
    await Promise.all([
      page.waitForURL('**/Page-Object-Model/products.html'),
      page.getByRole('link', { name: 'Our Products', exact: true }).click(),
    ]);

    await expect(page).toHaveTitle(/WebDriver/);
    await expect(page.getByRole('link', { name: 'Special Offers', exact: true })).toBeVisible();
  });

  test('navigates to Contact Us', async ({ page }) => {
    await Promise.all([
      page.waitForURL('**/Contact-Us/contactus.html'),
      page.getByRole('link', { name: 'Contact Us', exact: true }).click(),
    ]);

    await expect(page).toHaveTitle(/Contact Us/);
    await expect(page.getByRole('heading', { name: /Contact Us/i })).toBeVisible();
  });
});
