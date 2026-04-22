/**
 * smoke.spec.ts — Critical Path E2E Tests for MomDigital
 *
 * Auth Architecture:
 *   The backend issues JWTs exclusively as HttpOnly cookies (access_token /
 *   refresh_token). Playwright's browser context handles these transparently —
 *   we NEVER read from localStorage. The middleware checks `req.cookies.access_token`.
 *
 * Test Strategy:
 *   • Step 1: Register via UI → verify redirect
 *   • Step 2: Login via UI → verify cookie is set + dashboard loads
 *   • Step 3: Create a post via the community modal → verify it appears in the feed
 *   • Step 4: Like the post → verify optimistic count change
 *   • API contract smoke: direct request tests against the NestJS backend
 */

import { test, expect, type APIRequestContext } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const API_URL = process.env.BASE_API_URL ?? 'http://localhost:3001/api';

// Unique credentials per run to avoid DB conflicts
const RUN_ID = Date.now();
const testUser = {
  email: `e2e.mom.${RUN_ID}@momdigital.test`,
  password: 'SecurePass@2025!',
  name: 'E2E Test Mom',
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0], // 30 days from now
};

const testPost = {
  content: `E2E test post created at ${RUN_ID} — please ignore`,
  category: 'Wellness',
};

// ─── Helper: Register via API directly (faster than UI for setup) ─────────────
async function apiRegister(request: APIRequestContext) {
  const res = await request.post(`${API_URL}/auth/register`, {
    data: {
      email: testUser.email,
      password: testUser.password,
      name: testUser.name,
      dueDate: testUser.dueDate,
    },
  });
  return res;
}

// ─── Suite 1: Full UI Critical Path ──────────────────────────────────────────

test.describe('Critical Path: Register → Login → Post → Like', () => {
  // Register the test user once for the whole suite (via API — faster)
  test.beforeAll(async ({ request }) => {
    const res = await apiRegister(request);
    // Accept 201 (created) or 409 (conflict — user already exists from a prior run)
    expect([201, 409]).toContain(res.status());
  });

  // ── Step 1: Login via UI ────────────────────────────────────────────────────
  test('Step 1: Login sets cookie and redirects to /dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Fill the react-hook-form fields
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);

    // Click the login / submit button
    await page.click('button[type="submit"]');

    // Should redirect to dashboard (middleware uses access_token cookie)
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`, { timeout: 10_000 });

    // Verify the HttpOnly cookie was actually set by the browser
    const cookies = await page.context().cookies();
    const accessToken = cookies.find((c) => c.name === 'access_token');
    expect(accessToken).toBeDefined();
    expect(accessToken?.httpOnly).toBe(true);
  });

  // ── Step 2: Create a Post via the Community Modal ───────────────────────────
  test('Step 2: Add Post modal submits and post appears in feed', async ({ page }) => {
    // Log in first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`, { timeout: 10_000 });

    // Navigate to community
    await page.goto(`${BASE_URL}/community`);
    await page.waitForLoadState('networkidle');

    // Open the Add Post modal
    await page.click('#add-post-btn');

    // Modal should be visible (native <dialog> has role="dialog")
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Fill the form (textarea has id="post-content")
    await page.fill('#post-content', testPost.content);

    // Select category
    await page.selectOption('#post-category', testPost.category);

    // Submit
    await page.click('#submit-post-btn');

    // Modal should close after successful submission
    await expect(modal).not.toBeVisible({ timeout: 8_000 });

    // New post should appear at the top of the feed (optimistic insert)
    const postElement = page.locator(`[data-testid="post-item"]`).first();
    await expect(postElement).toBeVisible({ timeout: 5_000 });
    await expect(postElement).toContainText(testPost.content);
  });

  // ── Step 3: Like the Post (Optimistic UI) ───────────────────────────────────
  test('Step 3: Like button increments count optimistically', async ({ page }) => {
    // Log in
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`, { timeout: 10_000 });

    // Go to community
    await page.goto(`${BASE_URL}/community`);
    await page.waitForLoadState('networkidle');

    // Get the first like button
    const likeBtn = page.locator('[data-testid="like-button"]').first();
    await expect(likeBtn).toBeVisible({ timeout: 5_000 });

    // Read the current count
    const beforeText = (await likeBtn.textContent()) ?? '0';
    const beforeCount = parseInt(beforeText.replace(/\D/g, ''), 10);

    // Click like
    await likeBtn.click();

    // Expect optimistic increment (no waiting for network)
    await expect(likeBtn).toContainText(String(beforeCount + 1), {
      timeout: 2_000,
    });
  });
});

// ─── Suite 2: API Contract Smoke Tests ───────────────────────────────────────

test.describe('API Contract: Authentication', () => {
  test('POST /auth/login returns 200 and sets HttpOnly cookies', async ({ request }) => {
    // Ensure user exists
    await apiRegister(request);

    const res = await request.post(`${API_URL}/auth/login`, {
      data: { email: testUser.email, password: testUser.password },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('user');
    expect(body.user).toHaveProperty('email', testUser.email);

    // access_token is in the Set-Cookie header, NOT in the response body
    const setCookie = res.headers()['set-cookie'] ?? '';
    expect(setCookie).toContain('access_token');
    expect(setCookie).toContain('HttpOnly');
  });

  test('POST /auth/login returns 401 for invalid credentials', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'nobody@momdigital.test',
        password: 'WrongPassword123!',
      },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /auth/me returns 401 when unauthenticated', async ({ request }) => {
    const res = await request.get(`${API_URL}/auth/me`);
    expect(res.status()).toBe(401);
  });
});

test.describe('API Contract: Posts', () => {
  let authContext: APIRequestContext;
  let createdPostId: string;

  // Seed an authenticated context for all post tests
  test.beforeAll(async ({ playwright }) => {
    await playwright.request
      .newContext()
      .then(async (ctx) => {
        await ctx.post(`${API_URL}/auth/register`, {
          data: {
            email: testUser.email,
            password: testUser.password,
            name: testUser.name,
            dueDate: testUser.dueDate,
          },
        });
        // Login to get cookies
        const loginCtx = await playwright.request.newContext();
        await loginCtx.post(`${API_URL}/auth/login`, {
          data: { email: testUser.email, password: testUser.password },
        });
        authContext = loginCtx;
      })
      .catch(() => {
        /* ignore if already exists */
      });

    // Re-login for authContext
    const ctx = await playwright.request.newContext();
    await ctx.post(`${API_URL}/auth/login`, {
      data: { email: testUser.email, password: testUser.password },
    });
    authContext = ctx;
  });

  test('POST /posts creates a post (201)', async () => {
    const res = await authContext.post(`${API_URL}/posts`, {
      data: { content: 'API test post — E2E suite', category: 'General' },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('content');
    createdPostId = body.id;
  });

  test('GET /posts returns an array', async () => {
    const res = await authContext.get(`${API_URL}/posts`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});