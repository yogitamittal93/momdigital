import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3001/api';

// Test credentials
const testUser = {
  email: `testmom${Date.now()}@example.com`,
  password: 'SecurePassword123',
  name: 'Test Mom',
  dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
};

const testPost = {
  title: 'My First Post',
  content: 'This is my first post on MomDigital!',
};

test.describe('Critical Path: User Registration → Login → Create Post → Verify Feed', () => {
  let authToken: string;

  test('Step 1: User Registration', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="dueDate"]', testUser.dueDate);
    
    await page.click('button:has-text("Register")');
    
    // Expect redirect to login or dashboard
    await expect(page).toHaveURL(/\/(login|dashboard)/);
  });

  test('Step 2: User Login', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    
    await page.click('button:has-text("Login")');
    
    // Verify successful login by checking for dashboard or protected route
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
    
    // Extract JWT token from localStorage for subsequent API calls
    authToken = await page.evaluate(() => localStorage.getItem('jwt_token') || '');
    expect(authToken).toBeTruthy();
  });

  test('Step 3: Create Post', async ({ page }) => {
    // Set auth token in localStorage
    await page.goto(`${BASE_URL}/dashboard`);
    await page.evaluate((token) => localStorage.setItem('jwt_token', token), authToken);
    
    // Reload to ensure token is loaded
    await page.reload();
    
    // Click "Add Post" button to open modal
    await page.click('button:has-text("Add Post")');
    
    // Modal should be visible
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Fill in post form
    await page.fill('input[placeholder*="title"], input[name="title"]', testPost.title);
    await page.fill('textarea[name="content"], textarea[placeholder*="content"]', testPost.content);
    
    // Submit post
    await page.click('button:has-text("Create"), button:has-text("Post")');
    
    // Wait for success message or modal to close
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });

  test('Step 4: Verify Post Appears in Feed', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.evaluate((token) => localStorage.setItem('jwt_token', token), authToken);
    await page.reload();
    
    // Wait for feed to load
    await page.waitForSelector('article, [data-testid="post-item"], .post-card', { timeout: 5000 });
    
    // Check if the post title appears in the feed
    const postElement = page.locator(`text=${testPost.title}`);
    await expect(postElement).toBeVisible();
    
    // Verify post content is visible
    const contentElement = page.locator(`text=${testPost.content}`);
    await expect(contentElement).toBeVisible();
  });

  test('Step 5: Like Post (Bonus)', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.evaluate((token) => localStorage.setItem('jwt_token', token), authToken);
    await page.reload();
    
    // Find the post and click like button
    const postLocator = page.locator(`text=${testPost.title}`).first();
    const likeButton = postLocator.locator('button:has-text("Like"), [data-testid="like-button"]').first();
    
    await likeButton.click();
    
    // Verify like count increases
    await expect(likeButton).toContainText(/^\d+$/);
  });
});

test.describe('Smoke Test: Authentication Contract', () => {
  test('API Login returns JWT token', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: testUser.email,
        password: testUser.password,
      },
    });
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('token');
    expect(body.token).toBeTruthy();
  });

  test('API Rejects invalid credentials', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'nonexistent@example.com',
        password: 'WrongPassword123',
      },
    });
    
    expect(response.status()).toBe(401);
  });
});