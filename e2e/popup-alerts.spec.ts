import { test, expect } from '@playwright/test';

const PAGE_PATH = '/Popup-Alerts/index.html';

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE_PATH, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await expect(page.getByRole('heading', { name: 'Annoying Popup & Alerts!' })).toBeVisible();
});

test.describe('Popup & Alerts', () => {
  test('renders the four popup and alert examples', async ({ page }) => {
    for (const heading of [
      'JavaScript Alert',
      'Modal Popup',
      'Ajax Loader',
      'JavaScript Confirm Box',
    ]) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    }

    for (const id of ['button1', 'button2', 'button3', 'button4']) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
  });

  test('displays and accepts the JavaScript alert', async ({ page }) => {
    let dialogType: string | undefined;
    let dialogMessage: string | undefined;

    page.once('dialog', async (dialog) => {
      dialogType = dialog.type();
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    await page.locator('#button1').click();

    expect(dialogType).toBe('alert');
    expect(dialogMessage).toBe('I am an alert box!');
  });

  test('opens and closes the modal popup', async ({ page }) => {
    const modal = page.locator('#myModal');

    await expect(modal).toBeHidden();
    await page.locator('#button2').click();
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('It’s that Easy!!');
    await expect(modal).toContainText('WebElement.click()');

    await modal.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(modal).toBeHidden();
  });

  test('reports the confirmation when OK is selected', async ({ page }) => {
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toBe('Press a button!');
      await dialog.accept();
    });

    await page.locator('#button4').click();
    await expect(page.locator('#confirm-alert-text')).toHaveText('You pressed OK!');
  });

  test('reports the cancellation when Cancel is selected', async ({ page }) => {
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toBe('Press a button!');
      await dialog.dismiss();
    });

    await page.locator('#button4').click();
    await expect(page.locator('#confirm-alert-text')).toHaveText('You pressed Cancel!');
  });

  test('opens the Ajax Loader page', async ({ page }) => {
    await Promise.all([
      page.waitForURL('**/Ajax-Loader/index.html'),
      page.locator('#button3').click(),
    ]);

    await expect(page).toHaveTitle(/Ajax-Loader/);
  });
});
