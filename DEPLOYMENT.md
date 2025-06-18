# 🚀 Complete Deployment Guide

This comprehensive guide covers automatic deployment options for the Weather App to GitHub Pages and Netlify using Bun package manager.

## 📋 Prerequisites

- **Bun** installed (faster than npm/yarn)
- **Node.js 20+** installed
- **Git repository** on GitHub
- **Netlify account** (for Netlify deployment - optional)

## 🔧 Quick Setup

1. **Install Bun (if not already installed):**
   ```bash
   # macOS/Linux
   curl -fsSL https://bun.sh/install | bash

   # Or with Homebrew on macOS
   brew install bun
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Run tests to ensure everything works:**
   ```bash
   bun test
   ```

4. **Build locally to test:**
   ```bash
   bun run generate
   ```

## 🚀 Quick Start - Choose Your Method

### Option 1: GitHub Pages (Automatic) ⭐ Recommended
```bash
# Commit and push your code
git add .
git commit -m "Setup deployment"
git push origin main

# Then enable GitHub Pages in repository settings
```

### Option 2: Netlify (Automatic)
1. Sign up at [netlify.com](https://netlify.com)
2. Connect your GitHub repository
3. Build settings are pre-configured

### Option 3: Manual Deployment
```bash
# GitHub Pages
bun run deploy:github

# Netlify (requires netlify-cli)
bun run deploy:netlify:prod
```

## 🌐 Detailed Deployment Options

### GitHub Pages (Free, GitHub-hosted) ⭐ Recommended

#### ✅ Automatic Deployment (Recommended)

1. **Ensure your code is ready:**
   ```bash
   # Test build locally
   bun run generate

   # Commit all changes including bun.lockb
   git add .
   git commit -m "Setup GitHub Pages deployment"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to https://github.com/sak0a/wetter-app/settings
   - Navigate to "Pages" section (left sidebar)
   - Under "Source", select **"GitHub Actions"** (not "Deploy from a branch")
   - Click Save

3. **Monitor deployment:**
   - Go to Actions tab: https://github.com/sak0a/wetter-app/actions
   - Watch "Deploy to GitHub Pages" workflow
   - Wait 2-3 minutes for completion

4. **Your site will be live at:**
   ```
   https://sak0a.github.io/wetter-app/
   ```

#### 🔧 Manual Deployment
```bash
bun run deploy:github
```

### Netlify (Free tier available)

#### ✅ Automatic Deployment via Git

1. **Sign up at [netlify.com](https://netlify.com)**

2. **Connect your GitHub repository:**
   - Click "New site from Git"
   - Choose GitHub and authorize Netlify
   - Select your `wetter-app` repository

3. **Build settings (pre-configured):**
   - Build command: `bun run generate`
   - Publish directory: `.output/public`
   - Node version: `20`
   - Bun version: `latest`

4. **Deploy automatically:**
   - Every push to main branch triggers deployment
   - Preview deployments for pull requests
   - Get a custom URL like `https://your-app-name.netlify.app`

#### 🔧 Manual Deployment via CLI

1. **Install Netlify CLI:**
   ```bash
   bun add -g netlify-cli
   # or
   npm install -g netlify-cli
   ```

2. **Login and deploy:**
   ```bash
   netlify login
   bun run deploy:netlify:prod
   ```

## ⚡ Why Bun Package Manager?

Your project now uses **Bun** instead of npm for significantly faster builds:

- **2-10x faster** installs and builds
- **Better caching** and dependency resolution
- **Drop-in replacement** for npm/yarn
- **Smaller lock files** (`bun.lockb` vs `package-lock.json`)
- **Built-in test runner** and bundler

### Build Speed Comparison:
- **npm install**: ~30-60 seconds
- **bun install**: ~5-15 seconds

## 🔍 Platform Comparison

### GitHub Pages ⭐ Recommended
- ✅ **Free hosting** with GitHub account
- ✅ **Custom domain** support
- ✅ **HTTPS** by default
- ✅ **Automatic deployments** via GitHub Actions
- ✅ **Version control** integration
- ✅ **Fast with Bun** (~2-3 min deployments)
- ❌ Static sites only
- ❌ No server-side functions

### Netlify
- ✅ **Free tier** (100GB bandwidth/month)
- ✅ **Custom domain** support
- ✅ **HTTPS** by default
- ✅ **Automatic deployments** and PR previews
- ✅ **Form handling** and serverless functions
- ✅ **Edge functions** and built-in CDN
- ✅ **Super fast with Bun** (~1-2 min deployments)
- 💰 Paid plans for advanced features

## 🛠️ Configuration Files Created

### Core Configuration
- **`nuxt.config.ts`** - Updated with static generation and base URL settings
- **`bun.lockb`** - Bun lock file (commit this!)
- **`package.json`** - Updated scripts for Bun

### GitHub Pages
- **`.github/workflows/deploy-github-pages.yml`** - GitHub Actions workflow with Bun

### Netlify
- **`netlify.toml`** - Netlify configuration with Bun support

### Utilities
- **`check-deployment.js`** - Deployment status checker

## 🔧 Environment Variables

### GitHub Pages
Set in repository **Settings > Secrets and variables > Actions**

### Netlify
Set in **Site settings > Environment variables**

### Common Variables:
```bash
NODE_ENV=production
NUXT_PUBLIC_API_BASE_URL=https://api.open-meteo.com
BUN_VERSION=latest
```

## 📦 Available Scripts

```bash
# Development
bun run dev              # Start development server
bun run build            # Build for production
bun run generate         # Generate static site
bun run preview          # Preview built site

# Testing
bun test                 # Run tests
bun run test:ui          # Run tests with UI
bun run test:coverage    # Run tests with coverage

# Deployment
bun run deploy:github    # Deploy to GitHub Pages
bun run deploy:netlify   # Deploy preview to Netlify
bun run deploy:netlify:prod  # Deploy to Netlify production
bun run check:deployment # Check deployment status
```

## 🚨 Troubleshooting

### Build Fails
```bash
# Check Node.js version (should be 20+)
node --version

# Clear cache and reinstall
rm -rf node_modules bun.lockb
bun install

# Test build locally
bun run generate
```

### Site Not Loading
1. **Check build logs** in deployment platform
2. **Verify output**: Ensure `.output/public` folder is generated
3. **Browser console**: Check for JavaScript errors
4. **Base URL**: Verify correct path configuration

### GitHub Pages Issues
```bash
# Check if Pages is enabled
# Go to Settings > Pages > Source: GitHub Actions

# Verify workflow status
# Go to Actions tab and check latest run

# Test deployment status
bun run check:deployment
```

### Netlify Issues
1. **Build logs**: Check Netlify dashboard for errors
2. **Configuration**: Verify `netlify.toml` settings
3. **Dependencies**: Ensure `bun.lockb` is committed
4. **Environment**: Check Node/Bun versions match

### Common Fixes
```bash
# Lock file out of sync
rm bun.lockb && bun install

# Missing dependencies
bun add <missing-package>

# Build locally first
bun run generate && ls -la .output/public

# Check deployment status
bun run check:deployment
```

## 🌐 Your Live URLs

- **GitHub Pages**: https://sak0a.github.io/wetter-app/
- **Netlify**: Check your Netlify dashboard after connecting

## 🎯 Quick Commands Reference

```bash
# Deploy manually
bun run deploy:github        # GitHub Pages
bun run deploy:netlify:prod  # Netlify (requires netlify-cli)

# Check status
bun run check:deployment

# Local development
bun run dev                  # Start dev server
bun run generate            # Build static site
```

## 📞 Need Help?

1. **Check Status**: `bun run check:deployment`
2. **Build Locally**: `bun run generate`
3. **View Logs**: Check Actions/Netlify dashboard
4. **Manual Setup**: Follow the step-by-step instructions above

---

**Your weather app is ready to deploy with Bun! 🌤️⚡**

Choose GitHub Pages for simplicity or Netlify for advanced features. Both are now optimized with Bun for lightning-fast deployments!
