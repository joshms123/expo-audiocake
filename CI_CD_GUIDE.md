# CI/CD Guide for expo-audiocake

This document explains the automated CI/CD pipeline for expo-audiocake.

---

## 🔄 Workflow Overview

The CI/CD pipeline runs on **every push** and **pull request** to automatically test, build, and publish the package.

### Workflow File

`.github/workflows/ci.yml` contains three jobs:

1. **test** - Runs on Ubuntu (fastest)
2. **build-ios** - Runs on macOS (validates Swift code)
3. **publish** - Publishes to GitHub Packages (main branch only)

---

## 📋 Jobs Breakdown

### Job 1: Test & Validate (Ubuntu)

**Runs on:** Every push and PR  
**Platform:** Ubuntu (fast, cheap)  
**Duration:** ~2-3 minutes

**Steps:**
1. ✅ Checkout code
2. ✅ Setup Node.js 20
3. ✅ Install dependencies (`npm ci`)
4. ✅ Run TypeScript type validation
5. ✅ Build package (`npm run build`)
6. ✅ Run linter (`npm run lint`)

**Validates:**
- TypeScript types compile
- Package builds successfully
- Code follows style guidelines

---

### Job 2: Build iOS (macOS)

**Runs on:** Every push and PR (after test job passes)  
**Platform:** macOS (has Xcode and Swift)  
**Duration:** ~5-7 minutes

**Steps:**
1. ✅ Checkout code
2. ✅ Setup Node.js 20
3. ✅ Setup Xcode (latest stable)
4. ✅ Validate Swift syntax for all files

**Validates:**
- Swift code has valid syntax
- No Swift compilation errors
- iOS implementation is sound

---

### Job 3: Publish to GitHub Packages (Ubuntu)

**Runs on:** Only when pushing to `main` branch (after test and build-ios pass)  
**Platform:** Ubuntu  
**Duration:** ~2-3 minutes

**Steps:**
1. ✅ Checkout code
2. ✅ Setup Node.js with GitHub registry
3. ✅ Install dependencies
4. ✅ Build package
5. ✅ Publish to `@joshms123/expo-audiocake` on GitHub Packages

**Result:**
- New version published to GitHub Packages
- Users can install via `npm install @joshms123/expo-audiocake`

---

## 🎯 Trigger Conditions

| Event | Branches | Jobs Run |
|-------|----------|----------|
| **Push** | `main`, `develop` | test, build-ios, publish (main only) |
| **Pull Request** | → `main`, `develop` | test, build-ios |
| **Manual** | Any | All (via GitHub Actions UI) |

---

## ✅ Success Criteria

For a build to succeed:

1. **TypeScript Validation**
   - `TYPE_VALIDATION_TEST.ts` must compile without errors
   - All type definitions must be valid

2. **Package Build**
   - `npm run build` must succeed
   - Output files must be in `build/` directory

3. **Swift Validation**
   - All `.swift` files must have valid syntax
   - No Swift compilation errors

4. **Linter** (non-blocking)
   - Warnings allowed
   - Errors reported but don't fail build

---

## 📦 Publishing Process

### Automatic Publishing

Publishes automatically when:
- ✅ Push to `main` branch
- ✅ All tests pass
- ✅ iOS build succeeds

Published to:
- **Registry:** `npm.pkg.github.com`
- **Package:** `@joshms123/expo-audiocake`
- **Scope:** `@joshms123` (private by default)

### Manual Publishing

To publish manually:

```bash
# 1. Ensure you're on main branch
git checkout main
git pull origin main

# 2. Build the package
cd expo-audio
npm run build

# 3. Bump version (if needed)
npm version patch  # or minor, major

# 4. Publish
npm publish
```

---

## 🔑 Authentication & Secrets

### GITHUB_TOKEN

**What:** Automatically provided by GitHub Actions  
**Scope:** `read:packages`, `write:packages`, `contents:read`  
**Used for:** Publishing to GitHub Packages

**No setup needed!** GitHub provides this automatically.

### For Users (Installing from GitHub Packages)

Users need a **Personal Access Token** (PAT) to install:

1. Generate at: https://github.com/settings/tokens/new
2. Required scope: `read:packages`
3. Add to `.npmrc`:
   ```
   @joshms123:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=YOUR_TOKEN_HERE
   ```

---

## 🐛 Troubleshooting CI/CD

### Build Fails on TypeScript Validation

**Symptom:** `tsc --noEmit TYPE_VALIDATION_TEST.ts` fails

**Cause:** Type errors in new code

**Fix:**
```bash
# Test locally first
npm install -g typescript
tsc --noEmit TYPE_VALIDATION_TEST.ts
# Fix any errors shown
```

---

### Build Fails on npm ci

**Symptom:** `npm ci` exits with error

**Cause:** `package-lock.json` out of sync

**Fix:**
```bash
cd expo-audio
rm package-lock.json
npm install
git add package-lock.json
git commit -m "fix: Update package-lock.json"
git push
```

---

### Build Fails on Swift Validation

**Symptom:** Swift syntax validation fails

**Cause:** Swift syntax errors in `.swift` files

**Fix:**
```bash
# Validate locally (requires macOS with Xcode)
cd expo-audio/ios
for file in *.swift; do
  swift -frontend -parse "$file"
done
# Fix any errors shown
```

---

### Publish Fails with 401 Unauthorized

**Symptom:** `npm publish` returns 401

**Cause:** Invalid or missing GITHUB_TOKEN

**Fix:** Should not happen in CI (token auto-provided). If it does:
- Check workflow permissions in `.github/workflows/ci.yml`
- Ensure `permissions: packages: write` is set

---

### Package Not Found After Publish

**Symptom:** Users can't install via `npm install @joshms123/expo-audiocake`

**Cause:** Package is private, user doesn't have access

**Fix:**
```bash
# Option 1: Make package public
# Go to: https://github.com/joshms123/expo-audiocake/packages
# Settings → Danger Zone → Change visibility → Public

# Option 2: Users install directly from GitHub
npm install joshms123/expo-audiocake#main
```

---

## 📊 Monitoring

### Check Build Status

**GitHub Actions UI:**
https://github.com/joshms123/expo-audiocake/actions

**README Badge:**
[![CI](https://github.com/joshms123/expo-audiocake/actions/workflows/ci.yml/badge.svg)](https://github.com/joshms123/expo-audiocake/actions/workflows/ci.yml)

### View Published Packages

**GitHub Packages:**
https://github.com/joshms123?tab=packages

**Package Details:**
https://github.com/joshms123/expo-audiocake/packages

---

## 🔧 Customizing the Workflow

### Change Trigger Branches

Edit `.github/workflows/ci.yml`:

```yaml
on:
  push:
    branches: [main, develop, feature/*]  # Add more branches
  pull_request:
    branches: [main]
```

### Add More Tests

Add steps to the `test` job:

```yaml
- name: Run unit tests
  run: |
    cd expo-audio
    npm test

- name: Check test coverage
  run: |
    cd expo-audio
    npm run test:coverage
```

### Publish to npm Registry (public)

Change `publishConfig` in `expo-audio/package.json`:

```json
{
  "publishConfig": {
    "registry": "https://registry.npmjs.org",
    "access": "public"
  }
}
```

Then add `NPM_TOKEN` secret to GitHub repo.

---

## 🎓 Best Practices

### Before Merging to Main

1. ✅ All tests pass locally
2. ✅ TypeScript validation passes
3. ✅ Swift code compiles (if on macOS)
4. ✅ PR approved and reviewed
5. ✅ CI checks pass on PR

### Version Management

Use semantic versioning:

```bash
# Bug fixes
npm version patch  # 1.0.0 → 1.0.1

# New features (backward compatible)
npm version minor  # 1.0.0 → 1.1.0

# Breaking changes
npm version major  # 1.0.0 → 2.0.0
```

### Release Process

1. Update `CHANGELOG.md` with changes
2. Bump version: `npm version <patch|minor|major>`
3. Push to main: `git push origin main --tags`
4. CI automatically publishes
5. Create GitHub Release with release notes

---

## 📈 Performance Tips

### Caching Dependencies

Already enabled! Workflow uses:

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

Speeds up builds by ~30-40%.

### Skip CI (if needed)

Add `[skip ci]` to commit message:

```bash
git commit -m "docs: Update README [skip ci]"
```

CI will not run (use sparingly!).

---

## 🎯 Next Steps

1. ✅ **DONE:** CI workflow created
2. ✅ **DONE:** Package configured for GitHub Packages
3. ⏳ **TODO:** Test CI on actual push
4. ⏳ **TODO:** Verify publishing works
5. ⏳ **TODO:** Test installation from published package

---

## 📚 Related Documentation

- **INSTALLATION.md** - How users install the package
- **AUTOMATED_TESTS.md** - What tests run in CI
- **TESTING_SUMMARY.md** - Test coverage and results

For questions or issues with CI/CD, open an issue at:
https://github.com/joshms123/expo-audiocake/issues
