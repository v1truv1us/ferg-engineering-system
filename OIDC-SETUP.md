# OIDC Trusted Publishing Setup Guide

This guide covers setting up OIDC trusted publishing for the Ferg Engineering System to eliminate manual publishing and enhance security.

## 🎯 Overview

OIDC (OpenID Connect) trusted publishing provides:
- **No long-lived tokens**: Eliminates token theft risks
- **Automatic provenance**: Built-in supply chain security  
- **Short-lived credentials**: Tokens expire automatically
- **Workflow-specific**: Each workflow gets unique credentials

## 📋 Prerequisites

### System Requirements
- **npm CLI**: Version 11.5.1 or later
- **GitHub Actions**: With OIDC support (GitHub-hosted runners)
- **Repository**: Public or private npm package

### Package Information
- **Package**: `@v1truv1us/engineering-system`
- **Repository**: `v1truv1us/ai-eng-system`
- **Marketplace**: `v1truv1us/ai-eng-marketplace`

## 🔧 Step 1: Configure npm Trusted Publishers

### 1.1 Visit npm Package Settings
1. Go to: https://www.npmjs.com/package/@v1truv1us/engineering-system/access
2. Click on "Publishing access" or "Trusted publishers"

### 1.2 Add GitHub Actions as Trusted Publisher
Configure these settings:

**GitHub Repository**: `v1truv1us/ai-eng-system`
**Workflow Filename**: `.github/workflows/publish.yml`
**Environment**: (optional) `production` (if using environments)
**Branch Pattern**: `main` or `refs/tags/v*`

### 1.3 Maximum Security (Recommended)
After enabling trusted publishers, navigate to your package's **Settings → Publishing access → Select "Require two-factor authentication and disallow tokens"** for maximum security.

### 1.3 Alternative: Use Setup Script
You can use the `setup-npm-trusted-publish` action:

```yaml
- name: Setup trusted publishing
  uses: azu/setup-npm-trusted-publish@v1
  with:
    package: '@v1truv1us/engineering-system'
```

## 🚀 Step 2: GitHub Actions Workflows

### 2.1 Tag-Based Publishing (Recommended)
File: `.github/workflows/publish.yml`

```yaml
name: Publish to NPM

on:
  push:
    tags:
      - 'v*'  # Trigger on version tags like v1.0.0, v2.1.3, etc.
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to publish (leave empty for package.json version)'
        required: false
        type: string

permissions:
  id-token: write  # Required for OIDC
  contents: read    # Required for checkout

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Update npm to latest version
        run: npm install -g npm@latest

      - name: Install dependencies
        run: npm ci

      - name: Run tests (if available)
        run: npm test --if-present

      - name: Build package
        run: npm run build

      - name: Update version (if workflow_dispatch)
        if: github.event_name == 'workflow_dispatch' && github.event.inputs.version != ''
        run: npm version ${{ github.event.inputs.version }} --no-git-tag-version

      - name: Publish to NPM
        run: npm publish
        # No token needed - OIDC handles authentication automatically
        # Provenance is automatic with OIDC - no --provenance flag needed

      - name: Create GitHub Release
        if: startsWith(github.ref, 'refs/tags/')
        uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ github.ref_name }}
          name: Release ${{ github.ref_name }}
          draft: false
          prerelease: false
```

### 2.2 Auto-Publish from Main Branch
File: `.github/workflows/auto-publish.yml`

```yaml
name: Auto-publish from Main

on:
  push:
    branches:
      - main  # Current default branch

permissions:
  id-token: write
  contents: read

jobs:
  check-and-publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Need full history for version comparison

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Update npm
        run: npm install -g npm@latest

      - name: Install dependencies
        run: npm ci

      - name: Check if version changed
        id: version-check
        run: |
          CURRENT_VERSION=$(node -p "require('./package.json').version")
          PUBLISHED_VERSION=$(npm view @v1truv1us/ai-eng-system version 2>/dev/null || echo "0.0.0")
          if [ "$CURRENT_VERSION" != "$PUBLISHED_VERSION" ]; then
            echo "should_publish=true" >> $GITHUB_OUTPUT
            echo "version=$CURRENT_VERSION" >> $GITHUB_OUTPUT
          else
            echo "should_publish=false" >> $GITHUB_OUTPUT
          fi

      - name: Build and test
        if: steps.version-check.outputs.should_publish == 'true'
        run: |
          npm run build
          npm test --if-present

      - name: Publish to NPM
        if: steps.version-check.outputs.should_publish == 'true'
        run: npm publish
        # Provenance is automatic with OIDC - no --provenance flag needed

      - name: Create tag and release
        if: steps.version-check.outputs.should_publish == 'true'
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git tag -a "v${{ steps.version-check.outputs.version }}" -m "Release v${{ steps.version-check.outputs.version }}"
          git push origin "v${{ steps.version-check.outputs.version }}"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 2.3 Marketplace Notification
File: `.github/workflows/notify-marketplace.yml`

```yaml
name: Notify Marketplace

on:
  release:
    types: [published]

permissions:
  id-token: write
  contents: read

jobs:
  notify-marketplace:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger marketplace update
        uses: peter-evans/repository-dispatch@v3
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          repository: v1truv1us/ai-eng-marketplace
          event-type: release
          client-payload: '{"version": "${{ github.event.release.tag_name }}", "repository": "${{ github.repository }}", "release_url": "${{ github.event.release.html_url }}"}'
```

## 📦 Step 3: Package.json Configuration

Ensure your `package.json` includes proper publishing configuration:

```json
{
  "name": "@v1truv1us/ai-eng-system",
  "version": "2.0.0",
  "description": "Compounding engineering system for Claude Code and OpenCode. Shared agents, commands, and skills.",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "ai-eng-install": "scripts/install.js"
  },
  "files": [
    "dist/",
    "scripts/",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "bun run build.ts",
    "build:watch": "bun run build.ts --watch",
    "clean": "rm -rf dist",
    "validate": "bun run build.ts --validate",
    "prepublishOnly": "bun run build",
    "test": "echo \"No tests specified\" && exit 0",
    "install:global": "node scripts/install.js --global",
    "install:local": "node scripts/install.js --local"
  },
  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/v1truv1us/ai-eng-system.git"
  },
  "keywords": [
    "engineering",
    "workflow",
    "agents",
    "claude-code",
    "opencode",
    "code-review",
    "planning",
    "deployment",
    "seo",
    "optimization",
    "productivity"
  ],
  "author": {
    "name": "ferg-cod3s",
    "email": "contact@ferg-cod3s.dev",
    "url": "https://github.com/ferg-cod3s"
  },
  "license": "MIT",
  "engines": {
    "node": ">=16.0.0"
  }
}
```

## 🏪 Step 4: Marketplace Repository Setup

### 4.1 Create Marketplace Repository
```bash
gh repo create v1truv1us/ai-eng-marketplace --public --description "AI Engineering System - GitHub Marketplace"
```

### 4.2 Marketplace Configuration Files

#### `marketplace.json`
```json
{
  "name": "Ferg Engineering Marketplace",
  "description": "Curated collection of engineering tools, agents, and workflows by ferg-cod3s",
  "version": "1.0.0",
  "author": {
    "name": "ferg-cod3s",
    "email": "contact@ferg-cod3s.dev",
    "url": "https://github.com/ferg-cod3s"
  },
  "repository": "https://github.com/v1truv1us/ai-eng-marketplace",
  "license": "MIT",
  "plugins": [
    {
      "name": "ai-eng-system",
      "description": "Compounding engineering system with shared agents, commands, and skills for Claude Code & OpenCode",
      "version": "2.0.0",
      "author": "ferg-cod3s",
      "repository": "https://github.com/v1truv1us/ai-eng-system",
      "homepage": "https://github.com/v1truv1us/ai-eng-system#readme",
      "license": "MIT",
      "keywords": [
        "engineering",
        "workflow",
        "agents",
        "review",
        "planning",
        "deployment",
        "seo",
        "optimization"
      ],
      "category": "Development Tools",
      "tags": ["productivity", "code-review", "architecture", "workflow"],
      "sources": [
        {
          "type": "github",
          "url": "https://github.com/v1truv1us/ai-eng-system"
        }
      ],
      "compatibility": {
        "claude-code": ">=1.0.0",
        "opencode": ">=1.0.0"
      },
      "dependencies": {},
      "changelog": {
        "2.0.0": "Major refactor to single-source-of-truth architecture with build system",
        "1.0.0": "Initial release with basic commands and agents"
      },
      "stats": {
        "downloads": 0,
        "stars": 0,
        "last_updated": "2025-11-30"
      }
    }
  ],
  "categories": [
    {
      "name": "Development Tools",
      "description": "Tools for software development, code review, and workflow automation"
    },
    {
      "name": "Productivity",
      "description": "Tools to enhance development productivity and workflow efficiency"
    }
  ],
  "metadata": {
    "created_at": "2025-11-30T16:00:00Z",
    "updated_at": "2025-11-30T16:00:00Z",
    "total_plugins": 1,
    "categories": 2
  }
}
```

#### `.github/workflows/update-marketplace.yml`
```yaml
name: Update Marketplace

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to update to (e.g., 2.0.1)'
        required: true
        type: string
  repository_dispatch:
    types: [release]

permissions:
  id-token: write
  contents: write

jobs:
  update-marketplace:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout marketplace repo
        uses: actions/checkout@v4
        with:
          repository: v1truv1us/ai-eng-marketplace
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Update marketplace.json
        run: |
          VERSION="${{ github.event.inputs.version || github.event.client_payload.version }}"
          if [ -z "$VERSION" ]; then
            echo "No version provided, skipping update"
            exit 0
          fi
          
          # Update version in marketplace.json
          sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" marketplace.json
          sed -i "s/\"last_updated\": \"[^\"]*\"/\"last_updated\": \"$(date -u +%Y-%m-%d)\"/" marketplace.json
          
          echo "Updated marketplace.json to version $VERSION"

      - name: Commit and push
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add marketplace.json
          if git diff --staged --quiet; then
            echo "No changes to commit"
          else
            git commit -m "Update to $VERSION"
            git push
          fi
```

## 🔒 Step 5: Security Best Practices

### 5.1 Environment Protection
```yaml
environments:
  production:
    protection_rules:
      - type: "wait_timer"
        wait_timer: 5  # 5 minute delay
      - type: "reviewers"
        reviewers: ["ferg-cod3s"]
```

### 5.2 Branch Protection
```bash
gh api repos/v1truv1us/ai-eng-system/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["ci"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null
```

### 5.3 Workflow Permissions
Always use minimum required permissions:
```yaml
permissions:
  id-token: write  # Required for OIDC
  contents: read    # Required for checkout
  # Avoid: contents: write unless absolutely necessary
```

## 🧪 Step 6: Testing OIDC Setup

### 6.1 Test Workflow
```bash
# Create a test tag
git tag v2.0.1-test
git push origin v2.0.1-test

# Or trigger manually via GitHub UI
# Go to Actions > Publish to NPM > Run workflow
```

### 6.2 Verify Publishing
1. Check npm package page for new version
2. Verify provenance is attached (look for ✅ verified badge)
3. Test installation: `npm i @v1truv1us/ai-eng-system@2.0.1-test`

### 6.3 Debug Commands
```bash
# Check npm version
npm --version

# Test OIDC token (in GitHub Actions)
curl -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
  "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=npm"
```

## 🚨 Step 7: Troubleshooting

### Common Issues

#### 404 Errors on Publish
- Ensure trusted publisher is configured correctly
- Check workflow filename matches exactly
- Verify branch pattern is correct

#### Permission Denied
- Ensure `id-token: write` permission in workflow
- Check repository permissions for npm package

#### Provenance Issues
- Ensure npm CLI version 11.5.1+
- Use `--provenance` flag (automatic with OIDC)

#### Marketplace Not Updating
- Check repository dispatch permissions
- Verify webhook between repositories
- Check workflow logs for errors

### Recovery Steps

#### Reset Trusted Publishing
1. Remove existing trusted publisher in npm settings
2. Re-add with correct configuration
3. Test with a new workflow run

#### Manual Override
If OIDC fails, you can temporarily use traditional tokens:
```yaml
- name: Publish to NPM
  run: npm publish
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## ✅ Verification Checklist

Before going live, verify:

- [ ] npm CLI version 11.5.1+ installed
- [ ] Trusted publisher configured in npm settings
- [ ] GitHub Actions workflows created
- [ ] Workflow permissions set correctly
- [ ] Marketplace repository created
- [ ] Test workflow runs successfully
- [ ] Package publishes with provenance
- [ ] Marketplace updates automatically
- [ ] Installation works from both platforms

## 🎉 Benefits Achieved

With OIDC trusted publishing, you now have:

- **Enhanced Security**: No long-lived tokens
- **Automation**: Zero-touch publishing
- **Provenance**: Built-in supply chain security
- **Reliability**: Consistent publishing process
- **Compliance**: Enterprise-grade security standards

The Ferg Engineering System now has professional-grade, secure, automated publishing! 🚀