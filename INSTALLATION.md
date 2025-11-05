# Installation Guide for expo-audiocake

There are **three ways** to install `expo-audiocake`:

---

## Option 1: Install Directly from GitHub (Recommended for Development)

This is the simplest method - npm will clone and build directly from the repository.

### Installation

```bash
# In your Expo project
npm install joshms123/expo-audiocake#main
```

Or with a specific commit/tag:

```bash
npm install joshms123/expo-audiocake#v1.0.0
npm install joshms123/expo-audiocake#abc1234  # specific commit
```

### Usage

```typescript
import { setAudioModeAsync, getAudioSessionState } from 'expo-audiocake';

await setAudioModeAsync({
  allowsRecording: true,
  ios: {
    polarPattern: 'stereo',
    inputOrientation: 'landscapeLeft',
    preferredSampleRate: 48000
  }
});
```

### Pros/Cons

✅ **Pros:**
- No authentication needed
- Always get latest from main branch
- Simple one-line installation

❌ **Cons:**
- Slower installation (builds from source)
- No version management
- Requires git access

---

## Option 2: Install from GitHub Packages (Recommended for Production)

This installs pre-built packages from GitHub's npm registry. Requires authentication.

### Setup (One-time)

1. **Create GitHub Personal Access Token:**
   - Go to: https://github.com/settings/tokens/new
   - Name: "npm-packages-read"
   - Scopes: `read:packages`
   - Click "Generate token"
   - Copy the token (you won't see it again!)

2. **Configure npm:**

   Create `.npmrc` in your project root:

   ```bash
   @joshms123:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=YOUR_TOKEN_HERE
   ```

   Or use environment variable:

   ```bash
   echo "@joshms123:registry=https://npm.pkg.github.com" > .npmrc
   export GITHUB_TOKEN=your_token_here
   ```

3. **Add to .gitignore:**

   ```bash
   echo ".npmrc" >> .gitignore
   ```

### Installation

```bash
npm install @joshms123/expo-audiocake
```

Or with a specific version:

```bash
npm install @joshms123/expo-audiocake@1.0.0
```

### Usage

```typescript
import { setAudioModeAsync } from '@joshms123/expo-audiocake';

await setAudioModeAsync({
  allowsRecording: true,
  ios: { polarPattern: 'stereo' }
});
```

### Pros/Cons

✅ **Pros:**
- Faster installation (pre-built)
- Version management
- Standard npm workflow
- Works in CI/CD

❌ **Cons:**
- Requires GitHub authentication
- Setup needed for .npmrc

---

## Option 3: Local Installation (For Development)

Clone and link locally for development and testing.

### Setup

```bash
# Clone the repository
git clone https://github.com/joshms123/expo-audiocake.git
cd expo-audiocake

# Install dependencies and build
cd expo-audio
npm install
npm run build
```

### Installation

```bash
# In your Expo project
npm install ../path/to/expo-audiocake/expo-audio
```

Or use npm link:

```bash
# In expo-audiocake/expo-audio
npm link

# In your Expo project
npm link @joshms123/expo-audiocake
```

### Pros/Cons

✅ **Pros:**
- Full control over source
- Fastest for development iteration
- No authentication needed

❌ **Cons:**
- Must rebuild after changes
- Not suitable for production
- Manual updates required

---

## CI/CD Setup

### GitHub Actions

The repository includes automated CI/CD:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm publish
    env:
      NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Workflow Features

1. **On Every Push:**
   - ✅ Run TypeScript validation
   - ✅ Build package
   - ✅ Run linter

2. **On Main Branch Push:**
   - ✅ All tests pass
   - ✅ Build iOS (macOS runner)
   - ✅ Publish to GitHub Packages

3. **On Pull Requests:**
   - ✅ All tests must pass
   - ✅ No automatic publish

---

## Installation in Your Expo Project

After installing via any method above:

### 1. Install in Your Project

```bash
# Choose one:
npm install joshms123/expo-audiocake#main           # Option 1
npm install @joshms123/expo-audiocake               # Option 2
npm install ../path/to/expo-audio                   # Option 3
```

### 2. Update Expo Config

No changes needed! The package uses the same module name as `expo-audio`.

### 3. Prebuild (for iOS)

```bash
npx expo prebuild --platform ios --clean
```

### 4. Run Your App

```bash
# Development
npx expo run:ios

# Production
eas build --platform ios
```

---

## Verification

Check if installation succeeded:

```typescript
import * as ExpoAudio from 'expo-audiocake';

console.log('Functions:', Object.keys(ExpoAudio));
// Expected: ['setAudioModeAsync', 'setIsAudioActiveAsync', 'getAudioSessionState', ...]

console.log('Has iOS features:', typeof ExpoAudio.getAudioSessionState === 'function');
// Expected: true
```

---

## Troubleshooting

### "401 Unauthorized" Error (GitHub Packages)

**Cause:** Invalid or missing GitHub token.

**Fix:**
```bash
# Generate new token at https://github.com/settings/tokens/new
# Update .npmrc:
@joshms123:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_NEW_TOKEN
```

### "Package not found" (GitHub Packages)

**Cause:** Package hasn't been published yet, or no access to private repo.

**Fix:**
```bash
# Use Option 1 instead (direct from GitHub):
npm install joshms123/expo-audiocake#main
```

### Build Errors During Installation

**Cause:** Missing dependencies or native modules not linked.

**Fix:**
```bash
# Clean and rebuild
npx expo prebuild --clean
cd ios && pod install && cd ..
npx expo run:ios
```

### "Module not found" Runtime Error

**Cause:** Native module not linked properly.

**Fix:**
```bash
# For bare React Native:
cd ios && pod install && cd ..
npx react-native run-ios

# For Expo:
npx expo prebuild --clean
npx expo run:ios
```

### TypeScript Type Errors

**Cause:** Old type definitions cached.

**Fix:**
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
npm install
# Restart your editor/IDE
```

---

## Version Management

### Semantic Versioning

expo-audiocake follows semver:

- **Major (1.x.x):** Breaking API changes
- **Minor (x.1.x):** New features, backward compatible
- **Patch (x.x.1):** Bug fixes, backward compatible

### Installing Specific Versions

**GitHub Packages:**
```bash
npm install @joshms123/expo-audiocake@1.0.0      # Exact version
npm install @joshms123/expo-audiocake@^1.0.0     # Compatible with 1.x.x
npm install @joshms123/expo-audiocake@latest     # Latest published
```

**Direct from GitHub:**
```bash
npm install joshms123/expo-audiocake#v1.0.0      # Tag
npm install joshms123/expo-audiocake#abc1234     # Commit SHA
npm install joshms123/expo-audiocake#main        # Branch
```

---

## Updating

### GitHub Packages

```bash
npm update @joshms123/expo-audiocake
```

### Direct from GitHub

```bash
npm install joshms123/expo-audiocake#main --force
```

### After Update

```bash
npx expo prebuild --clean
npx expo run:ios
```

---

## Recommended Approach

| Use Case | Recommended Method |
|----------|-------------------|
| **Production App** | Option 2 (GitHub Packages) |
| **Quick Testing** | Option 1 (Direct from GitHub) |
| **Contributing** | Option 3 (Local clone) |
| **CI/CD** | Option 2 (GitHub Packages) |

---

## Example: Complete Setup for Production

```bash
# 1. Create GitHub token (one-time)
# Visit: https://github.com/settings/tokens/new
# Scopes: read:packages

# 2. Configure npm (one-time)
cat > .npmrc << EOF
@joshms123:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_TOKEN_HERE
EOF

# 3. Add to .gitignore (one-time)
echo ".npmrc" >> .gitignore

# 4. Install package
npm install @joshms123/expo-audiocake

# 5. Prebuild for iOS
npx expo prebuild --platform ios --clean

# 6. Run app
npx expo run:ios
```

Done! 🎉

---

## Support

- **Issues:** https://github.com/joshms123/expo-audiocake/issues
- **Documentation:** https://github.com/joshms123/expo-audiocake#readme
- **Examples:** See `TESTING_PLAN.md` for usage examples
