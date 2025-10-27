# Automated Testing and CI/CD Setup

This repository now includes automated testing and CI/CD workflows for the Q-SCI browser extension.

## Overview

The setup includes three main components:

1. **E2E Tests with Playwright** - Automated browser tests for the extension
2. **GitHub Actions CI Pipeline** - Automatic test execution on push/PR
3. **Optional Auto-Fix Workflow** - AI-powered fix suggestions for failing tests (opt-in)

## 1. E2E Testing with Playwright

### Local Testing

To run tests locally:

```bash
# Install dependencies (first time only)
npm install

# Build the extension
npm run build

# Install Playwright browsers (first time only)
npx playwright install --with-deps chromium

# Run tests
npm test

# Run tests with visible browser (for debugging)
npm run test:headed
```

### Test Structure

Tests are located in the `tests/` directory:

- `tests/extension.spec.ts` - Main extension tests
  - Extension loads correctly
  - Popup UI is displayed
  - Content script injection
  - Manifest validation

### Adding New Tests

Create new test files in the `tests/` directory following the Playwright test format:

```typescript
import { test, expect, chromium } from '@playwright/test';

test('your test name', async () => {
  // Your test code
});
```

## 2. GitHub Actions CI Pipeline

The CI pipeline is defined in `.github/workflows/extension-ci.yml` and runs automatically:

### Triggers

- Push to `main`, `dev`, `feature/**`, or `copilot/**` branches
- Pull requests to `main` or `dev`

### What it does

1. Checks out the code
2. Installs dependencies
3. Builds the extension
4. Runs all Playwright tests
5. Uploads test results as artifacts

### Viewing Results

- Check the "Actions" tab in GitHub
- Test results are uploaded as artifacts for failed runs
- All test output is visible in the workflow logs

## 3. Optional Auto-Fix Workflow

The auto-fix workflow is **opt-in** and provides AI-powered suggestions for fixing failing tests.

### How to Enable

1. Add your OpenAI API key to repository secrets:
   - Go to repository Settings → Secrets and variables → Actions
   - Add a new secret named `OPENAI_API_KEY`
   - Paste your OpenAI API key

2. Trigger the workflow:

   **Option A: Manual trigger**
   - Go to Actions → "Try AutoFix (Opt-in)"
   - Click "Run workflow"

   **Option B: Comment trigger**
   - On a failing PR, comment: `/autofix`
   - The workflow will run automatically

### What it does

1. Runs the test suite
2. If tests fail, captures the error output
3. Uses OpenAI GPT-4 to analyze the failures
4. Generates a conservative patch proposal
5. Creates a new PR with the suggested fixes

### Safety Features

- **Never auto-merges** - All PRs require manual review
- **Forbidden files** - Won't modify `manifest.json`
- **Size limits** - Patches are limited in size
- **Pattern detection** - Blocks suspicious changes (secrets, permissions, etc.)
- **Conservative** - Only suggests minimal, targeted fixes

### Important Notes

⚠️ **Always review auto-generated PRs carefully before merging!**

The auto-fix feature is experimental and may:
- Generate incorrect fixes
- Miss edge cases
- Suggest unnecessary changes

Use it as a starting point, not as a final solution.

## Configuration

### Playwright Configuration

Edit `playwright.config.ts` to customize test behavior:

```typescript
export default defineConfig({
  timeout: 60_000,  // Test timeout
  retries: 2,       // Number of retries
  workers: 1,       // Parallel workers
  // ... more options
});
```

### CI Configuration

Edit `.github/workflows/extension-ci.yml` to customize CI behavior:

- Change trigger branches
- Modify timeout limits
- Add additional build steps
- Configure test reporters

## Troubleshooting

### Tests fail locally but pass in CI

- Ensure Playwright browsers are installed: `npx playwright install chromium`
- Check that the extension is built: `npm run build`
- Verify clerk-config.js exists (copy from clerk-config.example.js)

### Auto-fix workflow doesn't trigger

- Verify `OPENAI_API_KEY` is set in repository secrets
- Check that the comment is exactly `/autofix` (case-sensitive)
- Ensure the workflow has proper permissions

### Tests are flaky

- Increase timeouts in test files
- Add explicit waits: `await page.waitForLoadState('domcontentloaded')`
- Use `test.retry()` for unstable tests

## Development Workflow

Recommended workflow for adding new features:

1. Create a feature branch
2. Write tests first (TDD approach)
3. Implement the feature
4. Run tests locally: `npm test`
5. Push to GitHub - CI runs automatically
6. If tests fail and you're stuck, try `/autofix` on the PR
7. Review and merge when tests pass

## Contributing

When contributing, please:

- Add tests for new features
- Ensure all tests pass before submitting PR
- Update this README if you change the test setup
- Keep tests fast and focused

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Chrome Extension Testing Guide](https://developer.chrome.com/docs/extensions/mv3/tut_testing/)

## Security

- Never commit API keys or secrets
- Review auto-generated PRs carefully
- Don't blindly merge automated changes
- Report security issues privately to repository owners
