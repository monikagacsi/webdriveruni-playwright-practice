import { test, expect, type Page } from '@playwright/test';

const PAGE_PATH = '/Contact-Us/contactus.html';

const contactForm = (page: Page) => page.locator('#contact_form');

const fillContactForm = async (
  page: Page,
  values: { firstName?: string; lastName?: string; email?: string; comments?: string },
) => {
  if (values.firstName !== undefined) {
    await page.getByPlaceholder('First Name', { exact: true }).fill(values.firstName);
  }
  if (values.lastName !== undefined) {
    await page.getByPlaceholder('Last Name', { exact: true }).fill(values.lastName);
  }
  if (values.email !== undefined) {
    await page.getByPlaceholder('Email Address', { exact: true }).fill(values.email);
  }
  if (values.comments !== undefined) {
    await page.getByPlaceholder('Comments', { exact: true }).fill(values.comments);
  }
};

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE_PATH, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await expect(page.getByRole('heading', { name: 'CONTACT US' })).toBeVisible();
});

test.describe('Contact Us form', () => {
  test('renders all contact fields and form actions', async ({ page }) => {
    await expect(contactForm(page)).toBeVisible();
    await expect(page.getByPlaceholder('First Name', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Last Name', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Email Address', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Comments', { exact: true })).toBeVisible();
    await expect(contactForm(page).locator('input[type="reset"]')).toHaveValue('RESET');
    await expect(contactForm(page).locator('input[type="submit"]')).toHaveValue('SUBMIT');
  });

  test('reports required fields and email errors when the form is empty', async ({ page }) => {
    await contactForm(page).locator('input[type="submit"]').click();

    await expect(page.locator('body')).toContainText('Error: all fields are required');
    await expect(page.locator('body')).toContainText('Error: Invalid email address');
    await expect(page.getByRole('link', { name: '← Try Again' })).toBeVisible();
  });

  test('reports required fields when any field is missing and the email is valid', async ({ page }) => {
    await fillContactForm(page, {
      firstName: 'Taylor',
      lastName: 'Tester',
      email: 'taylor.tester@example.com',
    });

    await contactForm(page).locator('input[type="submit"]').click();

    await expect(page.locator('body')).toContainText('Error: all fields are required');
    await expect(page.locator('body')).not.toContainText('Error: Invalid email address');
  });

  test('reports an invalid email when all fields are filled', async ({ page }) => {
    await fillContactForm(page, {
      firstName: 'Taylor',
      lastName: 'Tester',
      email: 'not-an-email',
      comments: 'Automated test message',
    });

    await contactForm(page).locator('input[type="submit"]').click();

    await expect(page.locator('body')).toContainText('Error: Invalid email address');
    await expect(page.locator('body')).not.toContainText('Error: all fields are required');
    await expect(page.getByRole('link', { name: '← Try Again' })).toBeVisible();
  });

  test('resets entered values', async ({ page }) => {
    await fillContactForm(page, {
      firstName: 'Taylor',
      lastName: 'Tester',
      email: 'taylor.tester@example.com',
      comments: 'Automated test message',
    });

    await contactForm(page).locator('input[type="reset"]').click();

    await expect(page.getByPlaceholder('First Name', { exact: true })).toHaveValue('');
    await expect(page.getByPlaceholder('Last Name', { exact: true })).toHaveValue('');
    await expect(page.getByPlaceholder('Email Address', { exact: true })).toHaveValue('');
    await expect(page.getByPlaceholder('Comments', { exact: true })).toHaveValue('');
  });

  test('shows confirmation after a valid submission', async ({ page }) => {
    await fillContactForm(page, {
      firstName: 'Taylor',
      lastName: 'Tester',
      email: 'taylor.tester@example.com',
      comments: 'Automated test message',
    });

    await contactForm(page).locator('input[type="submit"]').click();

    await expect(page.getByRole('heading', { name: 'Thank You for your Message!' })).toBeVisible();
    await expect(page.getByRole('link', { name: '← Back to Homepage' })).toHaveAttribute('href', '../index.html');
    await expect(contactForm(page)).toHaveCount(0);
  });
});
