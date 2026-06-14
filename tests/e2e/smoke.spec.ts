/**
 * smoke.spec.ts — Critical Path E2E Tests for MomDigital
 *
 * Auth Architecture:
 *   The backend issues JWTs exclusively as HttpOnly cookies (access_token /
 *   refresh_token). Playwright's browser context handles these transparently —
 *   we NEVER read from localStorage. The middleware checks req.cookies.access_token.
 *
 * Test Strategy:
 *   Suite 1 — UI Critical Path:
 *     Uses storageState to log in once in beforeAll, then reuses the
 *     authenticated browser context across all steps. No repeated login forms.
 *
 *   Suite 2 — API Contract:
 *     Uses a dedicated APIRequestContext (authContext) created in beforeAll
 *     with correct cookie propagation. Disposed in afterAll.
 *
 *   Suite 3 — API Auth Negative Cases:
 *     Unauthenticated request context — no cookies.
 */

import {
  test,
  expect,
  type APIRequestContext,
  type Browser,
} from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const API_URL = process.env.BASE_API_URL ?? 'http://localhost:3001/api';

// Auth state file — saved by Suite 1 beforeAll, reused by all steps
const AUTH_FILE = path.join(__dirname, '../../playwright/.auth/mom.json');

// Unique credentials per CI run to avoid DB conflicts across parallel runs
const RUN_ID = Date.now();
const testUser = {
  email: `e2e.mom.${RUN_ID}@momdigital.test`,
  password: 'SecurePass@2025!',
  name: 'E2E Test Mom',
  // 30 days from now — sent as date-only string matching backend DTO expectation
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0],
};

const testPost = {
  content: `E2E test post created at ${RUN_ID} — please ignore`,
  category: 'Wellness',
};

// ─── Shared helper: register via API (faster than UI, used across suites) ─────
async function apiRegister(request: APIRequestContext) {
  const res = await request.post(`${API_URL}/auth/register`, {
    data: {
      email: testUser.email,
      password: testUser.password,
      name: testUser.name,
      dueDate: testUser.dueDate,
    },
  });
  // 201 = created, 409 = already exists from a prior run — both are acceptable
  // Any other status (e.g. 400) means DTO validation failed — fail explicitly
  if (res.status() !== 409) {
    expect(res.status()).toBe(201);
  }
  return res;
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1: Full UI Critical Path
// beforeAll: registers user via API, logs in via browser, saves storageState.
// All steps reuse the saved auth state — no repeated login form fills.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Critical Path: Register → Login → Post → Like', () => {
  test.beforeAll(async ({ browser, request }: { browser: Browser; request: APIRequestContext }) => {
    // Step A: ensure the test user exists
    await apiRegister(request);

    // Step B: log in via browser and save cookie state to disk
    fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

    const page = await browser.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`, { timeout: 10_000 });

    // Persist cookies (including HttpOnly access_token) for reuse in all steps
    await page.context().storageState({ path: AUTH_FILE });
    await page.close();
  });

  // All tests in this suite start with the saved authenticated browser state
  test.use({ storageState: AUTH_FILE });

  // ── Step 1: Verify login cookie and dashboard ─────────────────────────────
  test('Step 1: Login sets HttpOnly cookie and dashboard loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Dashboard should load without redirect to /login
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`, { timeout: 10_000 });

    // Verify the HttpOnly access_token cookie is present
    const cookies = await page.context().cookies();
    const accessToken = cookies.find((c) => c.name === 'access_token');
    expect(accessToken).toBeDefined();
    expect(accessToken?.httpOnly).toBe(true);
  });

  // ── Step 2: Create a post via the community modal ─────────────────────────
  test('Step 2: Add Post modal submits and post appears in feed', async ({ page }) => {
    await page.goto(`${BASE_URL}/community`);
    await page.waitForLoadState('networkidle');

    // Open the Add Post modal
    await page.click('#add-post-btn');

    // Modal should be visible (native <dialog> or role="dialog")
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Fill content and select category
    await page.fill('#post-content', testPost.content);
    await page.selectOption('#post-category', testPost.category);

    // Submit
    await page.click('#submit-post-btn');

    // Modal should close after successful submission
    await expect(modal).not.toBeVisible({ timeout: 8_000 });

    // New post should appear at the top of the feed (optimistic insert)
    const postElement = page.locator('[data-testid="post-item"]').first();
    await expect(postElement).toBeVisible({ timeout: 5_000 });
    await expect(postElement).toContainText(testPost.content);
  });

  // ── Step 3: Like button increments count optimistically ───────────────────
  test('Step 3: Like button increments count optimistically', async ({ page }) => {
    await page.goto(`${BASE_URL}/community`);
    await page.waitForLoadState('networkidle');

    const likeBtn = page.locator('[data-testid="like-button"]').first();
    await expect(likeBtn).toBeVisible({ timeout: 5_000 });

    // Capture count before click
    const beforeText = (await likeBtn.textContent()) ?? '0';
    const beforeCount = parseInt(beforeText.replace(/\D/g, ''), 10);

    await likeBtn.click();

    // Optimistic update should happen without waiting for network
    await expect(likeBtn).toContainText(String(beforeCount + 1), {
      timeout: 2_000,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2: API Contract — Posts
// Creates its own APIRequestContext with valid auth cookies.
// Correctly disposes the context in afterAll.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('API Contract: Posts', () => {
  let authContext: APIRequestContext;
  let createdPostId: string;

  test.beforeAll(async ({ playwright }) => {
    // Ensure user exists
    const setup = await playwright.request.newContext();
    await setup.post(`${API_URL}/auth/register`, {
      data: {
        email: testUser.email,
        password: testUser.password,
        name: testUser.name,
        dueDate: testUser.dueDate,
      },
    });
    await setup.dispose();

    // Create a persistent authenticated context — cookies are carried across
    // all requests made through authContext within this suite
    authContext = await playwright.request.newContext();
    const loginRes = await authContext.post(`${API_URL}/auth/login`, {
      data: { email: testUser.email, password: testUser.password },
    });
    expect(loginRes.status()).toBe(200);
  });

  test.afterAll(async () => {
    await authContext.dispose();
  });

  test('POST /posts creates a post and returns 201 with id', async () => {
    const res = await authContext.post(`${API_URL}/posts`, {
      data: { content: 'API test post — E2E suite', category: 'General' },
    });
    expect([200, 201]).toContain(res.status());

    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('content');

    // Store for use in the GET assertion below
    createdPostId = body.id;
  });

  test('GET /posts returns array containing the created post', async () => {
    const res = await authContext.get(`${API_URL}/posts`);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);

    // Verify the specific post we created is present in the list
    const found = body.some((p: { id: string }) => p.id === createdPostId);
    expect(found).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3: API Contract — Authentication
// All negative/unauthenticated cases — no shared auth context needed.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('API Contract: Authentication', () => {
  test('POST /auth/login returns 200 and sets HttpOnly cookies', async ({ request }) => {
    // Ensure user exists before login attempt
    await apiRegister(request);

    const res = await request.post(`${API_URL}/auth/login`, {
      data: { email: testUser.email, password: testUser.password },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('user');
    expect(body.user).toHaveProperty('email', testUser.email);

    // access_token must be in Set-Cookie header, NOT in the response body
    // (body exposure would allow JS access, defeating HttpOnly purpose)
    const setCookie = res.headers()['set-cookie'] ?? '';
    expect(setCookie).toContain('access_token');
    expect(setCookie).toContain('HttpOnly');
  });

  test('POST /auth/login returns 401 for wrong password', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: testUser.email,
        password: 'WrongPassword999!',
      },
    });
    expect(res.status()).toBe(401);

    // Response must not reveal which field was wrong (no user enumeration)
    const body = await res.json();
    expect(body.message).not.toMatch(/email/i);
    expect(body.message).not.toMatch(/password/i);
  });

  test('POST /auth/login returns 401 for non-existent email', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'nobody@momdigital.test',
        password: 'IrrelevantPassword123!',
      },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /auth/me returns 401 when unauthenticated', async ({ request }) => {
    const res = await request.get(`${API_URL}/auth/me`);
    expect(res.status()).toBe(401);
  });
});