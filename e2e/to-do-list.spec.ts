import { test, expect, type Locator, type Page } from '@playwright/test';

const PAGE_PATH = '/To-Do-List/index.html';

const todos = (page: Page): Locator => page.getByRole('listitem');

const todoWithText = (page: Page, text: string): Locator =>
  todos(page).filter({ hasText: new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) });

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE_PATH, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await expect(page.getByRole('heading', { name: 'TO-DO LIST' })).toBeVisible();
});

test.describe('To-Do List', () => {
  test('shows the initial tasks and an input for new tasks', async ({ page }) => {
    await expect(todos(page)).toHaveText([
      'Go to potion class',
      'Buy new robes',
      'Practice magic',
    ]);
    await expect(page.getByPlaceholder('Add new todo', { exact: true })).toBeVisible();
  });

  test('adds a task on Enter and clears the input', async ({ page }) => {
    const input = page.getByPlaceholder('Add new todo', { exact: true });
    const taskText = 'Write regression tests';

    await input.fill(taskText);
    await input.press('Enter');

    await expect(todoWithText(page, taskText)).toHaveCount(1);
    await expect(input).toHaveValue('');
    await expect(todos(page)).toHaveCount(4);
  });

  test('toggles a task between active and completed', async ({ page }) => {
    const task = todoWithText(page, 'Buy new robes');

    await expect(task).not.toHaveClass(/completed/);
    await task.click();
    await expect(task).toHaveClass(/completed/);

    await task.click();
    await expect(task).not.toHaveClass(/completed/);
  });

  test('deletes only the selected task', async ({ page }) => {
    const task = todoWithText(page, 'Buy new robes');
    await expect(task).toHaveCount(1);

    await task.hover();
    await task.locator('span').click();

    await expect(task).toHaveCount(0);
    await expect(todoWithText(page, 'Go to potion class')).toHaveCount(1);
    await expect(todoWithText(page, 'Practice magic')).toHaveCount(1);
    await expect(todos(page)).toHaveCount(2);
  });

  test('toggles the new-task input with the plus control', async ({ page }) => {
    const input = page.getByPlaceholder('Add new todo', { exact: true });

    await expect(input).toBeVisible();
    await page.locator('#plus-icon').click();
    await expect(input).toBeHidden();

    await page.locator('#plus-icon').click();
    await expect(input).toBeVisible();
  });
});
