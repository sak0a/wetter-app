#!/usr/bin/env node

/**
 * Deployment Status Checker
 * Checks if the weather app is properly deployed and accessible
 */

import https from 'https';
import http from 'http';

const GITHUB_PAGES_URL = 'https://sak0a.github.io/wetter-app/';

function checkUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
      resolve({
        url,
        status: res.statusCode,
        success: isSuccess,
        message: isSuccess ? '✅ Site is accessible' : `❌ HTTP ${res.statusCode}`
      });
    });

    req.on('error', (error) => {
      resolve({
        url,
        status: 0,
        success: false,
        message: `❌ Connection failed: ${error.message}`
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        url,
        status: 0,
        success: false,
        message: '❌ Request timeout'
      });
    });
  });
}

async function checkDeployments() {
  console.log('🔍 Checking deployment status...\n');

  // Check GitHub Pages
  console.log('📄 GitHub Pages:');
  const githubResult = await checkUrl(GITHUB_PAGES_URL);
  console.log(`   ${githubResult.message}`);
  console.log(`   URL: ${githubResult.url}\n`);

  // Note about Netlify
  console.log('🌐 Netlify:');
  console.log('   ℹ️  Check your Netlify dashboard for the deployment URL');
  console.log('   ℹ️  URL format: https://your-site-name.netlify.app\n');

  // Summary
  console.log('📊 Summary:');
  console.log(`   GitHub Pages: ${githubResult.success ? '✅ Working' : '❌ Issues detected'}`);
  console.log('   Netlify: ℹ️  Manual check required\n');

  if (!githubResult.success) {
    console.log('🔧 Troubleshooting tips:');
    console.log('   1. Ensure GitHub Pages is enabled in repository settings');
    console.log('   2. Check if the GitHub Actions workflow completed successfully');
    console.log('   3. Verify the repository is public or you have GitHub Pro');
    console.log('   4. Wait a few minutes after deployment for DNS propagation\n');
  }

  console.log('🚀 For manual deployment:');
  console.log('   GitHub Pages: npm run deploy:github');
  console.log('   Netlify: npm run deploy:netlify:prod');
}

checkDeployments().catch(console.error);
