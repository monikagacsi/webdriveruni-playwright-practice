import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('/'); 
  const page1Promise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'CONTACT US Contact Us Form' }).click();
  const page1 = await page1Promise;
  await page1.getByRole('textbox', { name: 'First Name' }).click();
  await page1.getByRole('textbox', { name: 'First Name' }).fill('Test');
  await page1.getByRole('textbox', { name: 'Last Name' }).click();
  await page1.getByRole('textbox', { name: 'Last Name' }).fill('User');
  await page1.getByRole('textbox', { name: 'Email Address' }).click();
  await page1.getByRole('textbox', { name: 'Email Address' }).fill('invalid@email.com');
  await page1.getByRole('textbox', { name: 'Comments' }).click();
  await page1.getByRole('textbox', { name: 'Comments' }).fill('Hello, \nI\'m leaving a comment');
  await page1.getByRole('button', { name: 'SUBMIT' }).click();
});