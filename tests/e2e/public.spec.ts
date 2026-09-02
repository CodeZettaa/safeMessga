import { expect, test } from '@playwright/test';

test('home starts with a send button, then category, then the message box', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Have a question? Ask here' })).toBeVisible();
  await expect(page.getByPlaceholder('Leave a constructive message…')).toHaveCount(0);

  await page.getByRole('button', { name: 'Send a message' }).click();
  const categorySelect = page.getByLabel('Choose a category');
  await expect(categorySelect).toBeVisible();
  await expect(page.getByPlaceholder('Leave a constructive message…')).toHaveCount(0);

  const optionCount = await categorySelect.locator('option').count();
  if (optionCount > 1) {
    await categorySelect.selectOption({ index: 1 });
    await expect(page.getByPlaceholder('Leave a constructive message…')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
  }
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
});

test('optional name field can be revealed after choosing a category', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Send a message' }).click();
  const categorySelect = page.getByLabel('Choose a category');
  test.skip((await categorySelect.locator('option').count()) < 2, 'Categories are not seeded in this environment');
  await categorySelect.selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Add my name' }).click();
  await expect(page.getByLabel('Your name')).toBeVisible();
});

test('language switcher changes the public UI to Arabic', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'عربي' }).click();
  await expect(page.getByRole('heading', { name: 'عندك سؤال؟ اسألي هنا' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

test('admin dashboard is not publicly accessible', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login/);
});

test('questions page does not expose private field labels', async ({ page }) => {
  const response = await page.goto('/api/questions');
  expect(response?.ok()).toBeTruthy();
  const body = await response?.text();
  expect(body).not.toContain('sender_email');
  expect(body).not.toContain('sender_linkedin');
  expect(body).not.toContain('sender_hash');
  expect(body).not.toContain('original_message');
});
