#!/usr/bin/env node

const { execSync } = require('child_process');

function main() {
  try {
    const baseSha = process.env.GITHUB_BASE_SHA;
    const headSha = process.env.GITHUB_HEAD_SHA;

    if (!baseSha || !headSha) {
      console.error('ERROR: Missing GITHUB_BASE_SHA or GITHUB_HEAD_SHA');
      process.exit(1);
    }

    const commitRange = `${baseSha}..${headSha}`;
    const commits = execSync(`git rev-list ${commitRange}`)
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean);

    let failed = 0;

    for (const sha of commits) {
      const msg = execSync(`git log --format=%B -n 1 ${sha}`).toString().trim();

      if (!msg.includes('[codespaces]')) {
        console.log(`❌ Commit ${sha}: Verification failed`);
        failed = 1;
      } else {
        console.log(`✓ Commit ${sha}: Verified`);
      }
    }

    if (failed === 1) {
      console.log('');
      console.log('ERROR: Work environment verification failed');
      console.log(
        'Please ensure all work is completed in the designated environment',
      );
      process.exit(1);
    }
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

main();
