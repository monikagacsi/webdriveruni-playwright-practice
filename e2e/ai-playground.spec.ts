import { test, expect, type Page, type Locator } from '@playwright/test';

const PAGE_PATH = '/AI-Playground/index.html';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const card = (page: Page, title: string): Locator =>
  page.locator('.card').filter({
    has: page.getByRole('heading', {
      name: new RegExp(`^\\d+\\. ${escapeRegExp(title)}$`),
    }),
  });

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE_PATH, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await expect(page.getByRole('heading', { name: 'AI Testing Playground' })).toBeVisible();
});

/* -------------------------------------------------------------------------- */
test.describe('Page structure', () => {
  const titles = [
    'Dynamic Selectors', 'Flaky Loader', 'Multi-Step Form', 'Auto-Dismiss Toast',
    'Re-Enable Delay', 'Moving Target', 'Conditional Validation', 'Race Condition',
    'Lazy-Rendered Element', 'iFrame Login', 'Shadow DOM Widget', 'Employee Directory',
    'File Upload Validator', 'Priority Board', 'Stale Element', 'Invisible Success',
    'Timing Mismatch', 'Network States', 'JS Dialog Traps', 'localStorage Session',
    'Attribute vs Visual State', 'Mutation Observer', 'API Intercept', 'New Tab / Popup',
    'Shop & Checkout Flow',
  ];

  for (const title of titles) {
    test(`card resolves: ${title}`, async ({ page }) => {
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
      await expect(card(page, title)).toHaveCount(1);
      await expect(card(page, title)).toContainText(title);
    });
  }

  test('links to the booking portal and accessibility suite', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Open Booking Portal/ }))
      .toHaveAttribute('href', /Restaurant-Booking/);
    await expect(page.getByRole('link', { name: /Open the honey shop/ }))
      .toHaveAttribute('href', /Accessibility-Suite/);
  });
});

/* -------------------------------------------------------------------------- */
test.describe('1. Dynamic Selectors', () => {
  const fields = (c: Locator) => ({
    user: c.getByPlaceholder('Username', { exact: true }),
    pass: c.getByPlaceholder('Password', { exact: true }),
    submit: c.getByRole('button', { name: 'Login', exact: true }),
  });

  test('requires both fields before submitting', async ({ page }) => {
    const c = card(page, 'Dynamic Selectors');
    const f = fields(c);
    await f.submit.click();
    await expect(c.locator('#dynamic-error')).toBeVisible();
    await expect(c.locator('#dynamic-success')).toBeHidden();
  });

  test('accepts valid credentials', async ({ page }) => {
    const c = card(page, 'Dynamic Selectors');
    const f = fields(c);
    await f.user.fill('testuser');
    await f.pass.fill('pass123');
    await f.submit.click();
    await expect(c.locator('#dynamic-success')).toBeVisible();
  });
});

/* -------------------------------------------------------------------------- */
test.describe('2. Flaky Loader', () => {
  test('content eventually appears, whatever the delay', async ({ page }) => {
    const c = card(page, 'Flaky Loader');
    await expect(c.getByText('Content loaded successfully!')).toBeHidden();
    await expect(c.getByRole('button', { name: 'Click Me Now' })).toBeHidden();

    await c.getByRole('button', { name: 'Load Content' }).click();

    await expect(c.getByText('Content loaded successfully!')).toBeVisible({ timeout: 20_000 });
    await expect(c.getByText('Loading...')).toBeHidden();
    await expect(c.getByRole('button', { name: 'Click Me Now' })).toBeEnabled();
  });
});

/* -------------------------------------------------------------------------- */
test.describe('3. Multi-Step Form', () => {
  test('validates step 1 and blocks progress', async ({ page }) => {
    const c = card(page, 'Multi-Step Form');
    await expect(c.getByText('Step 1 of 3')).toBeVisible();

    await c.getByRole('button', { name: 'Next' }).click();
    await expect(c.getByText('Full name required (first and last)')).toBeVisible();
    await expect(c.getByText('Valid email required')).toBeVisible();
    await expect(c.getByText('Step 1 of 3')).toBeVisible();

    // Single word is still not "first and last"
    await c.locator('#ms-name').fill('Madonna');
    await c.locator('#ms-email').fill('not-an-email');
    await c.getByRole('button', { name: 'Next' }).click();
    await expect(c.getByText('Full name required (first and last)')).toBeVisible();
    await expect(c.getByText('Valid email required')).toBeVisible();
  });

  test('completes the full journey', async ({ page }) => {
    const c = card(page, 'Multi-Step Form');

    await test.step('step 1', async () => {
      await c.locator('#ms-name').fill('Jane Doe');
      await c.locator('#ms-email').fill('jane.doe@example.com');
      await c.locator('#ms-next-1').click();
      await expect(c.getByText('Step 2 of 3')).toBeVisible();
    });

    await test.step('step 2: country required, phone optional', async () => {
      await c.locator('#ms-next-2').click();
      await expect(c.getByText('Country is required')).toBeVisible();
      await c.locator('#ms-country').selectOption({ label: 'Germany' });
      await c.locator('#ms-next-2').click();
      await expect(c.getByText('Step 3 of 3')).toBeVisible();
    });

    await test.step('step 3: terms required', async () => {
      await c.getByRole('button', { name: 'Submit' }).click();
      await expect(c.getByText('You must accept the terms')).toBeVisible();
      await c.getByPlaceholder('Optional', { exact: true }).fill('Automated test run');
      await c.getByRole('checkbox', { name: /accept the terms/i }).check();
      await c.getByRole('button', { name: 'Submit' }).click();
      await expect(c.getByText('Form submitted successfully.')).toBeVisible();
    });
  });

  test('Back returns to the previous step', async ({ page }) => {
    const c = card(page, 'Multi-Step Form');
    await c.locator('#ms-name').fill('Jane Doe');
    await c.locator('#ms-email').fill('jane.doe@example.com');
    await c.locator('#ms-next-1').click();
    await c.locator('#ms-back-2').click();
    await expect(c.getByText('Step 1 of 3')).toBeVisible();
  });
});

/* -------------------------------------------------------------------------- */
test.describe('4. Auto-Dismiss Toast', () => {
  test('toast appears and then disappears', async ({ page }) => {
    const toast = page.locator('#toast');
    await card(page, 'Auto-Dismiss Toast').getByRole('button', { name: 'Trigger Toast' }).click();
    await expect(toast).toHaveCSS('opacity', '1');
    await expect(toast).toHaveCSS('opacity', '0', { timeout: 15_000 });
  });
});

/* -------------------------------------------------------------------------- */
test.describe('5. Re-Enable Delay', () => {
  test('button disables after click, then re-enables', async ({ page }) => {
    const btn = card(page, 'Re-Enable Delay').getByRole('button', { name: 'Click Me', exact: true });
    await expect(btn).toBeEnabled();
    await btn.click();
    await expect(btn).toBeDisabled();
    await expect(btn).toBeEnabled({ timeout: 15_000 });
  });
});

/* -------------------------------------------------------------------------- */
test.describe('6. Moving Target', () => {
  test('button can be clicked even while it moves', async ({ page }) => {
    const c = card(page, 'Moving Target');
    const btn = c.getByRole('button', { name: 'Catch Me' });
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(page.locator('#toast')).toHaveText('Got it!');
  });
});

/* -------------------------------------------------------------------------- */
test.describe('7. Conditional Validation', () => {
  test('validates the email format', async ({ page }) => {
    const c = card(page, 'Conditional Validation');
    await c.locator('#cond-email').fill('nope');
    await c.locator('#cond-submit').click();
    await expect(c.locator('#cond-email-err')).toBeVisible();
  });

  test('requires a valid code after accepting a valid email', async ({ page }) => {
    const c = card(page, 'Conditional Validation');
    const email = c.locator('#cond-email');
    const code = c.locator('#cond-code');

    await email.fill('jane.doe@example.com');
    await c.locator('#cond-submit').click();
    await expect(code).toBeVisible();
    await expect(c.locator('#cond-result')).toContainText('Verification required');

    await c.locator('#cond-submit').click();
    await expect(c.locator('#cond-code-err')).toBeVisible();
    await code.fill('12345');
    await c.locator('#cond-submit').click();
    await expect(c.locator('#cond-code-err')).toBeVisible();
    await code.fill('123456');
    await c.locator('#cond-submit').click();
    await expect(c.locator('#cond-email-err')).toBeHidden();
    await expect(c.locator('#cond-code-err')).toBeHidden();
    await expect(c.locator('#cond-result')).not.toBeEmpty();
  });
});

/* -------------------------------------------------------------------------- */
test.describe('8. Race Condition', () => {
  test('exactly one racer is reported as the winner', async ({ page }) => {
    const c = card(page, 'Race Condition');
    await Promise.all([
      c.getByRole('button', { name: 'Start Race A' }).click(),
      c.getByRole('button', { name: 'Start Race B' }).click(),
    ]);
    const result = c.locator('#race-result');
    await expect(result).toContainText(/win|won|finish/i, { timeout: 15_000 });
    const winners = (await result.innerText()).match(/\b(race )?[AB]\b[^\n]*\b(wins?|won|winner)\b/gi) ?? [];
    expect(winners).toHaveLength(1);
  });
});

/* -------------------------------------------------------------------------- */
test.describe('9. Lazy-Rendered Element', () => {
  test('element is absent until revealed', async ({ page }) => {
    const c = card(page, 'Lazy-Rendered Element');
    const el = c.getByText('I just appeared!');
    await expect(el).toBeHidden();
    await c.getByRole('button', { name: 'Reveal Element' }).click();
    await expect(el).toBeVisible();
  });
});

/* -------------------------------------------------------------------------- */
test.describe('10. iFrame Login', () => {
  test('rejects invalid credentials inside the iframe', async ({ page }) => {
    const c = card(page, 'iFrame Login');
    await expect(c.locator('#login-frame')).toBeVisible();
    const frame = c.frameLocator('#login-frame');
    await frame.getByPlaceholder('admin', { exact: true }).fill('wrong');
    await frame.getByPlaceholder('secret123', { exact: true }).fill('wrong');
    await frame.locator('#frame-submit').click();
    await expect(frame.locator('#frame-result')).toHaveText('Invalid credentials');
  });

  test('accepts valid credentials inside the iframe', async ({ page }) => {
    const frame = card(page, 'iFrame Login').frameLocator('#login-frame');
    await frame.getByPlaceholder('admin', { exact: true }).fill('admin');
    await frame.getByPlaceholder('secret123', { exact: true }).fill('secret123');
    await frame.locator('#frame-submit').click();
    await expect(frame.locator('#frame-result')).toContainText(/success|welcome/i);
  });
});

/* -------------------------------------------------------------------------- */
test.describe('11. Shadow DOM Widget', () => {
  test('inputs inside the shadow root can be filled', async ({ page }) => {
    const c = card(page, 'Shadow DOM Widget');
    const input = c.getByRole('textbox');
    await expect(input).toHaveCount(1);
    await expect(input).toBeVisible();
    await input.fill('shadow value');
    await expect(input).toHaveValue('shadow value');
  });
});

/* -------------------------------------------------------------------------- */
test.describe('12. Employee Directory', () => {
  // Columns: Name(1) Department(2) Salary(3) Status(4) Start Date(5)
  const setup = async (page: Page) => {
    const c = card(page, 'Employee Directory');
    const rows = c.locator('tbody tr');
    await expect(rows).not.toHaveCount(0);
    const cell = (row: Locator, name: string) => row.getByRole('cell').nth(
      ['Name', 'Department', 'Salary', 'Status', 'Start Date'].indexOf(name),
    );
    const salaries = async () =>
      (await Promise.all((await rows.all()).map((row) => cell(row, 'Salary').innerText())))
        .map((text) => Number(text.replace(/[^0-9.]/g, '')));
    return { c, rows, cell, salaries };
  };
  const sorted = (a: number[], dir: 1 | -1) =>
    a.every((v, i) => i === 0 || (a[i - 1] - v) * dir <= 0);

  test('table has the expected headers', async ({ page }) => {
    const { c } = await setup(page);
    for (const h of ['Name', 'Department', 'Salary', 'Status', 'Start Date']) {
      await expect(c.getByRole('columnheader', { name: h })).toBeVisible();
    }
  });

  test('filter by department only shows that department', async ({ page }) => {
    const { c, rows, cell } = await setup(page);
    const department = 'Engineering';
    await c.getByPlaceholder('Filter employees…', { exact: true }).fill(department);
    await expect
      .poll(async () => Promise.all((await rows.all()).map((row) => cell(row, 'Department').innerText())))
      .toEqual(expect.arrayContaining([department]));
    for (const row of await rows.all()) {
      await expect(cell(row, 'Department')).toHaveText(department);
    }
  });

  test('sorting by salary toggles ascending and descending', async ({ page }) => {
    const { c, salaries } = await setup(page);
    const header = c.getByRole('columnheader', { name: /salary/i });

    await header.click();
    await expect.poll(async () => { const s = await salaries(); return sorted(s, 1) || sorted(s, -1); }).toBe(true);
    const firstWasAsc = sorted(await salaries(), 1);

    await header.click();
    await expect.poll(async () => sorted(await salaries(), firstWasAsc ? -1 : 1)).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
test.describe('13. File Upload Validator', () => {
  const upload = async (
    page: Page,
    file: { name: string; mimeType: string; buffer: Buffer },
    resultSelector: '#file-result' | '#file-error',
    expected: RegExp,
  ) => {
    const c = card(page, 'File Upload Validator');
    await c.locator('#file-input').setInputFiles(file);
    await c.locator('#file-submit').click();
    await expect(c.locator(resultSelector)).toContainText(expected);
  };

  test('accepts a small PNG and reports its details', async ({ page }) => {
    await upload(page, { name: 'pixel.png', mimeType: 'image/png', buffer: PNG_1X1 }, '#file-result', /pixel\.png/);
  });

  test('rejects files over 2 MB', async ({ page }) => {
    await upload(
      page,
      { name: 'big.png', mimeType: 'image/png', buffer: Buffer.alloc(3 * 1024 * 1024) },
      '#file-error',
      /2\s?MB|too large|exceed|size/i,
    );
  });

  test('rejects unsupported file types', async ({ page }) => {
    await upload(
      page,
      { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') },
      '#file-error',
      /type|allowed|invalid|unsupported/i,
    );
  });
});

/* -------------------------------------------------------------------------- */
test.describe('14. Priority Board', () => {
  test('dragging a task moves it to another column', async ({ page }) => {
    const c = card(page, 'Priority Board');
    const backlog = c.locator('#backlog-column');
    const inProgress = c.locator('#inprogress-column');
    const task = c.getByText('Fix login bug', { exact: true });

    await expect(backlog).toContainText('Fix login bug');
    await task.dragTo(inProgress);

    await expect(inProgress).toContainText('Fix login bug');
    await expect(backlog).not.toContainText('Fix login bug');
    await expect(backlog).toContainText('Write unit tests');
  });
});

/* -------------------------------------------------------------------------- */
test.describe('15. Stale Element', () => {
  test('lazy locators survive repeated re-renders', async ({ page }) => {
    const c = card(page, 'Stale Element');
    const items = c.getByRole('listitem');
    await expect(items).not.toHaveCount(0);
    await expect(items.first()).toBeVisible();

    for (let i = 0; i < 3; i++) {
      await c.getByRole('button', { name: 'Force Re-render' }).click();
      // Re-resolved on every action, so a rebuilt DOM never leaves a stale reference.
      await items.first().click({ timeout: 5_000 });
    }
  });
});

/* -------------------------------------------------------------------------- */
test.describe('16. Invisible Success', () => {
  test('result is written to #ghost-result after a valid submit', async ({ page }) => {
    const c = card(page, 'Invisible Success');
    const ghost = page.locator('#ghost-result');
    await expect(ghost).not.toHaveText(/\S/);

    await c.getByPlaceholder('you@example.com', { exact: true }).fill('jane.doe@example.com');
    await c.locator('#ghost-submit').click();

    await expect(ghost).toBeAttached();
    await expect(ghost).toHaveText(/\S/);
  });

  test('invalid email shows an error and no result', async ({ page }) => {
    const c = card(page, 'Invisible Success');
    await c.getByPlaceholder('you@example.com', { exact: true }).fill('bad');
    await c.locator('#ghost-submit').click();
    await expect(c.locator('#ghost-email-err')).toBeVisible();
    await expect(page.locator('#ghost-result')).not.toHaveText(/\S/);
  });
});

/* -------------------------------------------------------------------------- */
test.describe('17. Timing Mismatch', () => {
  const num = (s: string) => Number(s.replace(/[^0-9.-]/g, ''));

  test('captured value is frozen while the counter keeps moving', async ({ page }) => {
    const c = card(page, 'Timing Mismatch');
    const counter = c.getByText(/Counter:/);
    const captured = c.getByText(/Captured:/);

    await expect(captured).toContainText('—');
    await c.getByRole('button', { name: 'Capture' }).click();
    await expect(captured).not.toContainText('—');

    const frozen = num(await captured.innerText());
    // wait for state (counter has moved past the capture), not for the clock
    await expect.poll(async () => num(await counter.innerText())).toBeGreaterThan(frozen);
    expect(num(await captured.innerText())).toBe(frozen);
  });
});

/* -------------------------------------------------------------------------- */
test.describe('18. Network States', () => {
  const cases: [string, RegExp, number][] = [
    ['Success', /success|ok|200|loaded/i, 10_000],
    ['Error', /error|fail|500/i, 10_000],
  ];

  for (const [button, pattern, timeout] of cases) {
    test(`${button} state is reported`, async ({ page }) => {
      test.setTimeout(timeout + 20_000);
      const c = card(page, 'Network States');
      await c.getByRole('button', { name: button, exact: true }).click();
      await expect(c.locator('#net-result')).toContainText(pattern, { timeout });
    });
  }

  test('a stalled request can be cancelled', async ({ page }) => {
    const c = card(page, 'Network States');
    await c.locator('#net-timeout').click();
    await expect(c.locator('#net-result')).toContainText('Waiting for server');
    await expect(c.locator('#net-cancel')).toBeVisible();
    await c.locator('#net-cancel').click();
    await expect(c.locator('#net-result')).toContainText('Request cancelled.');
  });
});

/* -------------------------------------------------------------------------- */
test.describe('19. JS Dialog Traps', () => {
  type Case = { button: RegExp; type: string; action: 'accept' | 'dismiss'; text?: string };
  const cases: Case[] = [
    { button: /trigger alert\(\)/i, type: 'alert', action: 'accept' },
    { button: /trigger confirm\(\)/i, type: 'confirm', action: 'accept' },
    { button: /trigger confirm\(\)/i, type: 'confirm', action: 'dismiss' },
    { button: /trigger prompt\(\)/i, type: 'prompt', action: 'accept', text: 'Playwright' },
    { button: /trigger prompt\(\)/i, type: 'prompt', action: 'dismiss' },
  ];

  for (const k of cases) {
    test(`${k.type}() is handled via ${k.action}`, async ({ page }) => {
      const seen: { type: string; message: string }[] = [];
      // Handler is registered BEFORE the click; an unhandled dialog would freeze the page.
      page.once('dialog', async (d) => {
        seen.push({ type: d.type(), message: d.message() });
        if (k.action === 'accept') await d.accept(k.text);
        else await d.dismiss();
      });

      await card(page, 'JS Dialog Traps').getByRole('button', { name: k.button }).click();

      await expect.poll(() => seen.length).toBe(1);
      expect(seen[0].type).toBe(k.type);
      expect(seen[0].message).not.toBe('');
      // page is still responsive afterwards
      await expect(page.getByRole('heading', { name: 'AI Testing Playground' })).toBeVisible();
    });
  }
});

/* -------------------------------------------------------------------------- */
test.describe('20. localStorage Session', () => {
  test('login writes to localStorage and logout clears it', async ({ page }) => {
    const c = card(page, 'localStorage Session');
    const keys = () => page.evaluate(() => Object.keys(localStorage).sort());
    const before = await keys();

    await c.locator('#ls-username').fill('testuser');
    await c.locator('#ls-password').fill('pass123');
    await c.locator('#ls-submit').click();

    await expect.poll(keys).not.toEqual(before); // the UI can lie, storage can't

    await c.locator('#ls-logout').click();
    await expect.poll(keys).toEqual(before);
  });
});

/* -------------------------------------------------------------------------- */
test.describe('21. Attribute vs Visual State', () => {
  test('aria-pressed follows the toggle', async ({ page }) => {
    test.fail(true, 'The playground intentionally desynchronizes aria-pressed for 30% of toggles');
    await page.addInitScript(() => {
      Math.random = () => 0.1;
    });
    await page.reload();

    const btn = card(page, 'Attribute vs Visual State').getByRole('button', { name: 'Inactive' });
    await expect(btn).toHaveAttribute('aria-pressed', 'false');

    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true', { timeout: 1_000 });
  });
});

/* -------------------------------------------------------------------------- */
test.describe('22. Mutation Observer', () => {
  test('items are added until the limit is reached', async ({ page }) => {
    const c = card(page, 'Mutation Observer');
    await expect(c.getByText('Items: 0 / 10')).toBeVisible();
    await c.getByRole('button', { name: 'Start' }).click();
    await expect(c.getByText('Items: 10 / 10')).toBeVisible({ timeout: 30_000 });
  });

  test('Stop freezes the count and Reset clears it', async ({ page }) => {
    const c = card(page, 'Mutation Observer');
    const counter = c.getByText(/Items: \d+ \/ 10/);

    await c.getByRole('button', { name: 'Start' }).click();
    await expect(counter).not.toHaveText('Items: 0 / 10');
    await c.getByRole('button', { name: 'Stop' }).click();

    const frozen = await counter.innerText();
    // Negative check: proving "nothing happens" needs a short bounded wait.
    await page.waitForTimeout(2_000);
    await expect(counter).toHaveText(frozen);

    await c.getByRole('button', { name: 'Reset' }).click();
    await expect(c.getByText('Items: 0 / 10')).toBeVisible();
  });
});

/* -------------------------------------------------------------------------- */
test.describe('23. API Intercept', () => {
  const apiUrl = '**/api/user.json';
  const mockedUsers = [
    { id: 1, name: 'Mocked User', email: 'mock@example.com', role: 'QA Engineer' },
  ];

  test('real request succeeds', async ({ page }) => {
    const c = card(page, 'API Intercept');
    const [res] = await Promise.all([
      page.waitForResponse((response) => response.url().includes('/api/user.json')),
      c.getByRole('button', { name: 'Fetch User Data' }).click(),
    ]);
    expect(res.ok()).toBe(true);
  });

  test('mocked response is rendered', async ({ page }) => {
    await page.route(apiUrl, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockedUsers),
      }),
    );
    const c = card(page, 'API Intercept');
    await c.getByRole('button', { name: 'Fetch User Data' }).click();
    await expect(c.locator('#intercept-status')).toContainText('1 users loaded');
    await expect(c.locator('#intercept-result')).toContainText('Mocked User');
    await expect(c.locator('#intercept-result')).toContainText('mock@example.com');
  });

  test('failed request is handled gracefully', async ({ page }) => {
    await page.route(apiUrl, (route) => route.abort('failed'));
    const c = card(page, 'API Intercept');
    await c.getByRole('button', { name: 'Fetch User Data' }).click();
    await expect(c.locator('#intercept-status')).toContainText(/error|fail|unable|could not/i);
  });
});

/* -------------------------------------------------------------------------- */
test.describe('24. New Tab / Popup', () => {
  test('opens a confirmation tab with content', async ({ page }) => {
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      card(page, 'New Tab / Popup').getByRole('button', { name: 'Open Confirmation' }).click(),
    ]);
    await popup.waitForLoadState('domcontentloaded');
    await expect(popup.locator('body')).not.toBeEmpty();
    await expect(popup).toHaveURL(/webdriveruniversity\.com|about:blank/);
  });
});

/* -------------------------------------------------------------------------- */
test.describe('25. Shop & Checkout Flow', () => {
  const addProduct = async (c: Locator, name: string) => {
    const product = c.locator('.product-card-item').filter({ hasText: name });
    await expect(product).toHaveCount(1);
    await product.getByRole('button', { name: 'Add', exact: true }).click();
  };

  const toDelivery = async (c: Locator) => {
    await c.getByRole('button', { name: /Proceed to Delivery/ }).click();
  };

  const fillDelivery = async (c: Locator, postcode = 'SW1A 1AA') => {
    await c.getByPlaceholder('Jane Doe', { exact: true }).fill('Jane Doe');
    await c.getByPlaceholder('jane@example.com', { exact: true }).fill('jane.doe@example.com');
    await c.getByPlaceholder('123 High Street', { exact: true }).fill('10 Downing Street');
    await c.getByPlaceholder('e.g. London', { exact: true }).fill('London');
    await c.getByPlaceholder('e.g. SW1A 1AA', { exact: true }).fill(postcode);
  };

  test('empty cart blocks checkout', async ({ page }) => {
    const c = card(page, 'Shop & Checkout Flow');
    await expect(c.getByText('Cart is empty')).toBeVisible();
    await expect(c.getByText('Total: £0.00')).toBeVisible();
    await toDelivery(c);
    await expect(c.getByText('Add at least one item to continue.')).toBeVisible();
    await expect(c.locator('#checkout-name')).toBeHidden();
  });

  test('cart totals update as items are added', async ({ page }) => {
    const c = card(page, 'Shop & Checkout Flow');
    await addProduct(c, 'Wireless Headphones');
    await expect(c.getByText('Total: £89.99')).toBeVisible();
    await addProduct(c, 'USB-C Hub 7-in-1');
    await expect(c.getByText('Total: £124.98')).toBeVisible();
    await expect(c.getByText(/Cart\s*2/)).toBeVisible();
  });

  test('delivery form validates every field', async ({ page }) => {
    const c = card(page, 'Shop & Checkout Flow');
    await addProduct(c, 'Laptop Stand Aluminium');
    await toDelivery(c);

    const invalidCases = [
      { field: 'Jane Doe', value: 'Jane', error: '#checkout-name-err' },
      { field: 'jane@example.com', value: 'invalid', error: '#checkout-email-err' },
      { field: '123 High Street', value: '', error: '#checkout-address-err' },
      { field: 'e.g. London', value: '', error: '#checkout-city-err' },
      { field: 'e.g. SW1A 1AA', value: 'NOT A POSTCODE', error: '#checkout-postcode-err' },
    ];

    for (const { field, value, error } of invalidCases) {
      await fillDelivery(c);
      await c.getByPlaceholder(field, { exact: true }).fill(value);
      await c.getByRole('button', { name: /Review Order/ }).click();
      await expect(c.locator(error)).toBeVisible();
    }
  });

  test('full purchase journey', async ({ page }) => {
    const c = card(page, 'Shop & Checkout Flow');

    await addProduct(c, 'Wireless Headphones');
    await addProduct(c, 'Mechanical Keyboard TKL');
    await expect(c.getByText('Total: £219.98')).toBeVisible();

    await toDelivery(c);
    await fillDelivery(c);
    await c.getByRole('button', { name: /Review Order/ }).click();

    await expect(c.getByText('Please confirm your order details.')).toBeVisible();
    await expect(c.locator('#review-name')).toHaveText('Jane Doe');
    await expect(c.locator('#review-email')).toHaveText('jane.doe@example.com');
    await expect(c.locator('#review-address')).toContainText('10 Downing Street');
    await expect(c.locator('#review-total')).toHaveText('£219.98');

    await c.getByRole('button', { name: 'Confirm Order' }).click();
    await expect(c.getByText('Order confirmed!')).toBeVisible();
    await expect(c.getByText(/Your order ID is/)).toBeVisible();

    await c.getByRole('button', { name: 'Start New Order' }).click();
    await expect(c.getByText('Cart is empty')).toBeVisible();
  });

  test('Back keeps the cart intact', async ({ page }) => {
    const c = card(page, 'Shop & Checkout Flow');
    await addProduct(c, 'Wireless Headphones');
    await toDelivery(c);
    await c.getByRole('button', { name: /Back/ }).click();
    await expect(c.getByText('Total: £89.99')).toBeVisible();
  });
});
