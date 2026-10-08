import { test, expect, type Locator, type Page } from '@playwright/test';

const PAGE_PATH = '/Autocomplete-TextField/autocomplete-textfield.html';

const autocompleteList = (page: Page): Locator =>
  page.locator('#myInputautocomplete-list');

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE_PATH, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await expect(page.getByRole('heading', { name: 'Autocomplete TextField' })).toBeVisible();
});

test.describe('Autocomplete TextField', () => {
  test('shows the food input and submit control', async ({ page }) => {
    await expect(page.getByPlaceholder('Food Item', { exact: true })).toBeVisible();
    await expect(page.locator('#submit-button')).toBeVisible();
  });

  test('filters suggestions by a case-insensitive prefix', async ({ page }) => {
    await page.getByPlaceholder('Food Item', { exact: true }).fill('pi');

    const suggestions = autocompleteList(page).locator(':scope > div');
    await expect(suggestions).toHaveCount(1);
    await expect(suggestions).toHaveText('Pizza');
  });

  test('selects a suggestion and closes the list', async ({ page }) => {
    const input = page.getByPlaceholder('Food Item', { exact: true });
    await input.fill('piz');

    const suggestion = autocompleteList(page).locator(':scope > div');
    await expect(suggestion).toHaveText('Pizza');
    await suggestion.click();

    await expect(input).toHaveValue('Pizza');
    await expect(autocompleteList(page)).toHaveCount(0);
  });

  test('supports selecting the first suggestion with the keyboard', async ({ page }) => {
    const input = page.getByPlaceholder('Food Item', { exact: true });
    await input.fill('p');
    await expect(autocompleteList(page).locator(':scope > div')).toHaveCount(3);

    await input.press('ArrowDown');
    await input.press('Enter');

    await expect(input).toHaveValue('Pizza');
    await expect(autocompleteList(page)).toHaveCount(0);
  });

  test('shows no suggestions for unmatched input and removes the list when cleared', async ({ page }) => {
    const input = page.getByPlaceholder('Food Item', { exact: true });
    await input.fill('not-a-food');

    const list = autocompleteList(page);
    await expect(list.locator(':scope > div')).toHaveCount(0);

    await input.clear();
    await expect(list).toHaveCount(0);
  });

  test('submits the selected food item', async ({ page }) => {
    const input = page.getByPlaceholder('Food Item', { exact: true });
    await input.fill('piz');
    await autocompleteList(page).locator(':scope > div').click();

    await Promise.all([
      page.waitForURL((url) => url.searchParams.get('food-item') === 'Pizza'),
      page.locator('#submit-button').click(),
    ]);

    await expect(page).toHaveURL(/food-item=Pizza/);
  });
});
