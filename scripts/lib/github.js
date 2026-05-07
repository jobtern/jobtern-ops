// All GitHub API interactions.

const https = require('https');

function githubRequest(path, token, options = {}) {
  return new Promise((resolve, reject) => {
    const payload = options.body ? JSON.stringify(options.body) : null;
    const req = https.request(
      {
        hostname: 'api.github.com',
        path,
        method: options.method || 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'jobtern-review-bot',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, body });
          }
        });
      },
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function fetchDiff(owner, repo, pullNumber, token) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.github.com',
        path: `/repos/${owner}/${repo}/pulls/${pullNumber}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3.diff',
          'User-Agent': 'jobtern-review-bot',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => resolve(body));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

async function fetchRepoFile(owner, repo, filePath, token) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.github.com',
        path: `/repos/${owner}/${repo}/contents/${filePath}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.raw+json',
          'User-Agent': 'jobtern-review-bot',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            return reject(
              new Error(`Failed to fetch ${filePath}: HTTP ${res.statusCode}`),
            );
          }
          resolve(body);
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

async function fetchPriorReviews(owner, repo, pullNumber, token) {
  const { status, body } = await githubRequest(
    `/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`,
    token,
  );
  if (status !== 200) return [];
  return body
    .filter(
      (r) => r.user?.login === 'github-actions[bot]' && r.state !== 'PENDING',
    )
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
}

async function fetchLatestSha(owner, repo, pullNumber, fallbackSha, token) {
  const { body } = await githubRequest(
    `/repos/${owner}/${repo}/pulls/${pullNumber}`,
    token,
  );
  return body?.head?.sha || fallbackSha;
}

async function fetchLabels(owner, repo, pullNumber, token) {
  const { body } = await githubRequest(
    `/repos/${owner}/${repo}/issues/${pullNumber}/labels`,
    token,
  );
  return Array.isArray(body) ? body.map((l) => l.name) : [];
}

async function postReview(
  owner,
  repo,
  pullNumber,
  { body, event, commitId },
  token,
) {
  return githubRequest(
    `/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`,
    token,
    { method: 'POST', body: { body, event, commit_id: commitId } },
  );
}

async function postComment(owner, repo, pullNumber, body, token) {
  return githubRequest(
    `/repos/${owner}/${repo}/issues/${pullNumber}/comments`,
    token,
    { method: 'POST', body: { body } },
  );
}

async function postInlineComment(
  owner,
  repo,
  pullNumber,
  { body, path, position, commitId },
  token,
) {
  return githubRequest(
    `/repos/${owner}/${repo}/pulls/${pullNumber}/comments`,
    token,
    { method: 'POST', body: { body, path, position, commit_id: commitId } },
  ).catch(() => null);
}

async function addLabels(owner, repo, pullNumber, labels, token) {
  return githubRequest(
    `/repos/${owner}/${repo}/issues/${pullNumber}/labels`,
    token,
    { method: 'POST', body: { labels } },
  ).catch((err) =>
    console.warn(`Could not add labels [${labels.join(', ')}]:`, err.message),
  );
}

async function removeLabel(owner, repo, pullNumber, label, token) {
  return githubRequest(
    `/repos/${owner}/${repo}/issues/${pullNumber}/labels/${encodeURIComponent(label)}`,
    token,
    { method: 'DELETE' },
  ).catch(() => {});
}

const HOLDING_COMMENT = [
  '## Assessment review',
  '',
  'We are experiencing a temporary issue with our review system. Your submission has been received — we will post your review shortly.',
  '',
  'No action needed on your part. Please do not remove or re-add the label.',
  '',
  '---',
  '*Reviewed by Jobtern.*',
].join('\n');

module.exports = {
  githubRequest,
  fetchDiff,
  fetchRepoFile,
  fetchPriorReviews,
  fetchLatestSha,
  fetchLabels,
  postReview,
  postComment,
  postInlineComment,
  addLabels,
  removeLabel,
  HOLDING_COMMENT,
};
