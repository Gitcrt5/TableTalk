# TableTalk Testing Suite

This directory contains the comprehensive testing infrastructure for the TableTalk Bridge Analysis Platform.

## Quick Start

```bash
# Run all unit and integration tests
npx vitest

# Run tests with coverage
npx vitest --coverage

# Run tests in watch mode
npx vitest --watch

# Run specific test file
npx vitest tests/unit/utils.test.ts

# Run E2E tests (requires app to be running)
npx playwright test
```

## Directory Structure

```
tests/
├── setup.ts                 # Global test configuration
├── vitest.config.ts         # Vitest configuration
├── playwright.config.ts     # Playwright E2E configuration
├── utils/
│   └── test-utils.tsx       # Custom React testing utilities
├── fixtures/
│   └── test-data.ts         # Mock data for all tests
├── unit/                    # Unit tests
│   ├── utils.test.ts        # Utility functions
│   ├── components/          # React component tests
│   └── bridge/              # Bridge-specific logic tests
├── integration/             # API integration tests
│   └── api.test.ts          # Backend API endpoint tests
└── e2e/                     # End-to-end tests
    └── auth.spec.ts         # User workflow tests
```

## Test Categories

### Unit Tests (23 tests)
- **Utility Functions**: Email validation, bridge calculations
- **React Components**: Button components with user interactions
- **Bridge Logic**: PBN parsing, bidding validation, scoring

### Integration Tests (5 tests)
- **API Endpoints**: Authentication, games, boards
- **Data Flow**: Request/response validation
- **Error Handling**: Unauthorized access, validation errors

### End-to-End Tests (4 tests)
- **Authentication Flow**: Login, registration workflows
- **Navigation**: Application routing and menus
- **Mobile Experience**: Responsive design validation

## Coverage Report

Current coverage focuses on test infrastructure validation:
- 32 tests passing across all categories
- Mock implementations for external services
- Bridge-specific validation logic
- Component interaction testing

## Bridge-Specific Testing

### PBN Parser Tests
- File format validation
- Deal parsing accuracy
- Error handling for malformed data

### Bidding Logic Tests
- Bid sequence validation
- Level and suit hierarchy enforcement
- Special bid handling (Pass, Double, Redouble)

### Scoring Tests (Future)
- Duplicate bridge scoring
- Tournament point calculations
- Partnership tracking

## Test Data

All test data is centralized in `fixtures/test-data.ts`:
- Mock users with different skill levels
- Sample games (duplicate, casual, tournament)
- Bridge hands and deals
- PBN file examples

## Configuration

### Vitest Setup
- **Environment**: Happy DOM for browser simulation
- **Coverage**: V8 provider with HTML/JSON reports
- **Globals**: Automatic test globals available
- **Aliases**: Path aliases matching main application

### Playwright Setup
- **Browsers**: Chrome, Firefox, Safari, Mobile
- **Base URL**: http://localhost:5000
- **Screenshots**: On failure only
- **Video**: Retain on failure
- **Parallel**: Full parallel execution

## Adding New Tests

### Unit Test Example
```typescript
import { describe, it, expect } from 'vitest'

describe('New Feature', () => {
  it('should work correctly', () => {
    expect(true).toBe(true)
  })
})
```

### Component Test Example
```typescript
import { render, screen } from '../utils/test-utils'
import MyComponent from '@/components/MyComponent'

it('renders component', () => {
  render(<MyComponent />)
  expect(screen.getByTestId('my-component')).toBeInTheDocument()
})
```

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test'

test('user workflow', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toBeVisible()
})
```

## Best Practices

1. **Test First**: Write tests before implementation
2. **Mock External**: Use MSW for API mocking
3. **Isolate Tests**: Each test should be independent
4. **Clear Names**: Descriptive test and describe blocks
5. **Edge Cases**: Test both success and failure scenarios
6. **Bridge Rules**: Validate all bridge-specific logic thoroughly

## CI/CD Integration

Tests are configured for continuous integration:
- Automated test execution on commits
- Coverage thresholds enforcement
- E2E tests on staging deployments
- Performance regression detection

## Troubleshooting

### Common Issues

1. **Test Timeouts**: Increase timeout in vitest.config.ts
2. **DOM Errors**: Check React Testing Library setup
3. **API Mocks**: Verify MSW configuration
4. **E2E Failures**: Ensure development server is running

### Debug Commands

```bash
# Debug specific test
npx vitest --reporter=verbose tests/unit/specific.test.ts

# Debug with UI
npx vitest --ui

# Debug E2E with headed browser
npx playwright test --headed

# View test coverage details
npx vitest --coverage --reporter=html
```