import { test, expect } from '@playwright/test';

const PAGE_PATH = '/Dropdown-Checkboxes-RadioButtons/index.html';

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE_PATH, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await expect(
    page.getByRole('heading', { name: 'Dropdown Menu(s), Checkboxe(s) & Radio Button(s)' }),
  ).toBeVisible();
});

test.describe('Dropdowns, Checkboxes & Radio Buttons', () => {
  test('renders the dropdown, checkbox, and radio sections', async ({ page }) => {
    for (const heading of [
      'Dropdown Menu(s)',
      'Checkboxe(s)',
      'Radio Button(s)',
      'Selected & Disabled',
    ]) {
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }

    await expect(page.locator('.dropdown-menu-lists')).toHaveCount(4);
    await expect(page.locator('#checkboxes input[type="checkbox"]')).toHaveCount(4);
    await expect(page.locator('#radio-buttons input[type="radio"]')).toHaveCount(5);
  });

  test('selects options from each dropdown', async ({ page }) => {
    const selections = [
      { selector: '#dropdowm-menu-1', value: 'python', label: 'Python' },
      { selector: '#dropdowm-menu-2', value: 'testng', label: 'TestNG' },
      { selector: '#dropdowm-menu-3', value: 'javascript', label: 'JavaScript' },
    ];

    for (const { selector, value, label } of selections) {
      const dropdown = page.locator(selector);
      await dropdown.selectOption(value);
      await expect(dropdown).toHaveValue(value);
      await expect(dropdown.locator('option:checked')).toHaveText(label);
    }
  });

  test('checks and unchecks checkbox options independently', async ({ page }) => {
    const option1 = page.getByRole('checkbox', { name: 'Option 1' });
    const option2 = page.getByRole('checkbox', { name: 'Option 2' });
    const option3 = page.getByRole('checkbox', { name: 'Option 3' });

    await expect(option1).not.toBeChecked();
    await expect(option2).not.toBeChecked();
    await expect(option3).toBeChecked();

    await option1.check();
    await option2.check();
    await option3.uncheck();

    await expect(option1).toBeChecked();
    await expect(option2).toBeChecked();
    await expect(option3).not.toBeChecked();
  });

  test('radio selections are exclusive within their group', async ({ page }) => {
    const green = page.locator('#radio-buttons input[name="color"][value="green"]');
    const purple = page.locator('#radio-buttons input[name="color"][value="purple"]');

    await expect(green).not.toBeChecked();
    await expect(purple).not.toBeChecked();

    await green.check();
    await expect(green).toBeChecked();

    await purple.check();
    await expect(purple).toBeChecked();
    await expect(green).not.toBeChecked();
  });

  test('preserves the selected and disabled control states', async ({ page }) => {
    const vegetables = page.locator('#radio-buttons-selected-disabled');
    const pumpkin = vegetables.locator('input[value="pumpkin"]');
    const cabbage = vegetables.locator('input[value="cabbage"]');

    await expect(pumpkin).toBeChecked();
    await expect(cabbage).toBeDisabled();

    const fruit = page.locator('#fruit-selects');
    await expect(fruit).toHaveValue('grape');
    await expect(fruit.locator('option[value="orange"]')).toBeDisabled();

    await fruit.selectOption('pear');
    await expect(fruit).toHaveValue('pear');
  });
});
