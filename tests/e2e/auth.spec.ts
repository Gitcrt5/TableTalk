import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should display login page when not authenticated', async ({ page }) => {
    await page.goto('/')
    
    // Check if we're redirected to login or see login elements
    await expect(page).toHaveURL(/auth|login/)
    await expect(page.locator('text=Login')).toBeVisible()
  })

  test('should handle login form validation', async ({ page }) => {
    await page.goto('/auth')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Check for validation errors
    await expect(page.locator('text=required')).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test('should have proper navigation structure', async ({ page }) => {
    await page.goto('/')
    
    // Check for main navigation elements
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
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