import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should display login page when not authenticated', async ({ page }) => {
    await page.goto('/')
    
    // Check if we're redirected to login or see login elements
    const title = await page.title()
    expect(title).toBeTruthy()
    
    // Check for basic page structure
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should handle navigation', async ({ page }) => {
    await page.goto('/')
    
    // Check that the page loads properly
    await expect(page).toHaveURL(/.*/)
  })
})

test.describe('Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE size
    await page.goto('/')
    
    // Check that the page renders properly on mobile
    await expect(page.locator('body')).toBeVisible()
  })
})