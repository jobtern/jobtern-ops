// .github/scripts/review.js
// Runs inside GitHub Actions — checked out from jobtern-ops by the assessment repo workflow.

const https = require('https');

// ── HTTP helpers ──────────────────────────────────────────────────────────────

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
          } catch (e) {
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

async function callClaude({ systemPrompt, userPrompt, apiKey }) {
  const payload = JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const maxRetries = 4;
  const baseDelay = 10000; // 10 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'api.anthropic.com',
          path: '/v1/messages',
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
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
            } catch (e) {
              reject(new Error(`Failed to parse Claude response: ${body}`));
            }
          });
        },
      );
      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    if (result.status === 529 || result.status === 429) {
      if (attempt < maxRetries) {
        const delay = baseDelay * attempt;
        console.log(
          `Anthropic API ${result.status} — retrying in ${delay / 1000}s (attempt ${attempt}/${maxRetries})...`,
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
    }

    return result;
  }
}

// ── Notion logging ────────────────────────────────────────────────────────────

async function logToNotion({ apiKey, databaseId, data }) {
  const payload = JSON.stringify({
    parent: { database_id: databaseId },
    properties: {
      Candidate: { title: [{ text: { content: data.candidate } }] },
      Client: { rich_text: [{ text: { content: data.client } }] },
      Role: { rich_text: [{ text: { content: data.role } }] },
      'PR number': { number: data.prNumber },
      Attempt: { number: data.attempt },
      'Assessment repo': { url: data.assessmentRepo },
      'PR URL': { url: data.prUrl },
      'Submitted at': { date: { start: data.submittedAt } },
      'Reviewed at': { date: { start: data.reviewedAt } },
      Verdict: { select: { name: data.verdict } },
      'Hire signal': { select: { name: data.hireSignal } },
      'Adjusted hire signal': { select: { name: data.adjustedHireSignal } },
      'Hard fails': { rich_text: [{ text: { content: data.hardFails } }] },
      'Score modifier': { number: data.scoreModifier },
      'Raw total': { number: data.rawTotal },
      'Adjusted total': { number: data.adjustedTotal },
      'Technical discipline': { number: data.technicalDiscipline },
      Reliability: { number: data.reliability },
      Communication: { number: data.communication },
      'Team readiness': { number: data.teamReadiness },
      Correctness: { number: data.correctness },
      Craft: { number: data.craft },
      'Scope and judgment': { number: data.scopeAndJudgment },
      'Task completion': { number: data.taskCompletion },
      'Brief adherence': { number: data.briefAdherence },
      'Runnable instructions': { number: data.runnableInstructions },
      'Submission timing': { number: data.submissionTiming },
      'Commit messages': { number: data.commitMessages },
      'PR description': { number: data.prDescription },
      README: { number: data.readme },
      'Code documentation': { number: data.codeDocumentation },
      'Code transferability': { number: data.codeTransferability },
      'Git narrative': { number: data.gitNarrative },
      'Explicit surface area': { number: data.explicitSurfaceArea },
      'Review summary': {
        rich_text: [{ text: { content: data.reviewSummary.slice(0, 2000) } }],
      },
    },
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.notion.com',
        path: '/v1/pages',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
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
          } catch (e) {
            resolve({ status: res.statusCode, body });
          }
        });
      },
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── Diff annotation ───────────────────────────────────────────────────────────

function annotateDiff(diff) {
  const lines = diff.split('\n');
  const annotated = [];
  const positionMap = {};

  let currentFile = null;
  let position = 0;
  let inHunk = false;

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      const match = line.match(/diff --git a\/.+ b\/(.+)/);
      currentFile = match ? match[1] : null;
      if (currentFile) positionMap[currentFile] = new Set();
      position = 0;
      inHunk = false;
      annotated.push(line);
    } else if (
      !inHunk &&
      (line.startsWith('index ') ||
        line.startsWith('--- ') ||
        line.startsWith('+++ ') ||
        line.startsWith('new file') ||
        line.startsWith('deleted file') ||
        line.startsWith('Binary files') ||
        line.startsWith('similarity') ||
        line.startsWith('rename'))
    ) {
      annotated.push(line);
    } else if (line.startsWith('@@')) {
      inHunk = true;
      position++;
      if (currentFile) positionMap[currentFile].add(position);
      annotated.push(`[pos:${position}]${line}`);
    } else if (inHunk) {
      position++;
      if (currentFile) positionMap[currentFile].add(position);
      annotated.push(`[pos:${position}]${line}`);
    } else {
      annotated.push(line);
    }
  }

  return { annotatedDiff: annotated.join('\n'), positionMap };
}

// ── Prior reviews ─────────────────────────────────────────────────────────────

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

// ── Score modifier ────────────────────────────────────────────────────────────

function getModifier(attemptNumber) {
  if (attemptNumber === 1) return 1.0;
  if (attemptNumber === 2) return 0.95;
  return 0.9;
}

// ── Hire signal ───────────────────────────────────────────────────────────────

function getHireSignal(total, hasHardFails) {
  if (hasHardFails || total < 10) return 'no';
  if (total < 13) return 'weak';
  if (total < 17) return 'moderate';
  return 'strong';
}

// ── Ordinal ───────────────────────────────────────────────────────────────────

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  const {
    ANTHROPIC_API_KEY,
    ROLE,
    GITHUB_TOKEN,
    NOTION_API_KEY,
    NOTION_DATABASE_ID,
    PR_OWNER,
    PR_REPO,
    PR_NUMBER,
    PR_HEAD_SHA,
    PR_BODY,
    PR_CREATED_AT,
    PR_AUTHOR,
  } = process.env;

  if (!ROLE) {
    console.error('ROLE is not set. Run new-assessment.sh to configure it.');
    process.exit(1);
  }

  // 1. Fetch prior reviews to determine attempt number
  const priorReviews = await fetchPriorReviews(
    PR_OWNER,
    PR_REPO,
    PR_NUMBER,
    GITHUB_TOKEN,
  );
  const attemptNumber = priorReviews.length + 1;
  const modifier = getModifier(attemptNumber);

  console.log(`Attempt: ${ordinal(attemptNumber)} | Modifier: ${modifier}`);

  // Cap at 3 attempts
  if (attemptNumber > 3) {
    const capComment = [
      '## Assessment review',
      '',
      'You have reached the maximum number of submissions for this assessment.',
      'No further reviews will be run on this pull request.',
      '',
      '---',
      '*Reviewed by Jobtern.*',
    ].join('\n');

    await githubRequest(
      `/repos/${PR_OWNER}/${PR_REPO}/issues/${PR_NUMBER}/comments`,
      GITHUB_TOKEN,
      { method: 'POST', body: { body: capComment } },
    );

    await githubRequest(
      `/repos/${PR_OWNER}/${PR_REPO}/issues/${PR_NUMBER}/labels/ready-for-review`,
      GITHUB_TOKEN,
      { method: 'DELETE' },
    ).catch(() => {});

    await githubRequest(
      `/repos/${PR_OWNER}/${PR_REPO}/issues/${PR_NUMBER}/labels/changes-requested`,
      GITHUB_TOKEN,
      { method: 'DELETE' },
    ).catch(() => {});

    await githubRequest(
      `/repos/${PR_OWNER}/${PR_REPO}/issues/${PR_NUMBER}/labels`,
      GITHUB_TOKEN,
      { method: 'POST', body: { labels: ['submission-closed'] } },
    ).catch(() => console.warn('Could not add submission-closed label'));

    console.log('Maximum attempts reached. No review posted.');
    return;
  }

  // 2. Fetch rubric from jobtern-ops and task from assessment repo
  console.log('Fetching rubric...');
  const rubric = await fetchRepoFile(
    'jobtern',
    'jobtern-ops',
    `rubrics/${ROLE}.md`,
    GITHUB_TOKEN,
  );

  console.log('Fetching task...');
  const task = await fetchRepoFile(PR_OWNER, PR_REPO, 'TASK.md', GITHUB_TOKEN);

  // 3. Fetch and annotate PR diff
  const rawDiff = await fetchDiff(PR_OWNER, PR_REPO, PR_NUMBER, GITHUB_TOKEN);
  const { annotatedDiff, positionMap } = annotateDiff(rawDiff);
  const truncatedDiff =
    annotatedDiff.length > 80000
      ? annotatedDiff.slice(0, 80000) +
        '\n\n[diff truncated — evaluate what is visible]'
      : annotatedDiff;

  // 4. Build prompts
  const priorReviewSection =
    priorReviews.length > 0
      ? [
          '## Prior review(s)',
          '',
          'The following reviews were posted on earlier submissions of this PR.',
          'Do not re-flag unchanged code. Do not escalate soft violations to hard fails.',
          'Only flag new issues in code that changed since the last review.',
          '',
          ...priorReviews.map((r, i) => `### Attempt ${i + 1}\n${r.body}`),
        ].join('\n')
      : '';

  const systemPrompt = [
    'You are a senior engineer conducting a code review for a junior engineering screening assessment.',
    'Your job is to evaluate the submission honestly and without diplomatic softening.',
    '',
    'You are provided with two documents:',
    '1. The task — what the candidate was asked to build',
    '2. The rubric — how to score the submission',
    '',
    'Read the task first so you understand what was required.',
    'Then score the submission against the rubric.',
    '',
    'IMPORTANT — inline comments:',
    'Each line in the diff is prefixed with [pos:N] where N is its diff position.',
    'For inline_comments, set "position" to the [pos:N] number of the line you are commenting on.',
    'Set "file" to the filepath shown in the diff --git header (without a/ or b/ prefix).',
    'Only comment on lines that appear in the diff — lines with a [pos:N] prefix.',
    'If you cannot find a relevant diff line for an observation, omit the inline comment.',
    '',
    'Return ONLY valid JSON — no prose, no markdown fences, no explanation outside the JSON object.',
    '',
    '## Task',
    '',
    task,
    '',
    '## Rubric',
    '',
    rubric,
  ].join('\n');

  const userPrompt = [
    '## Candidate PR description',
    '',
    PR_BODY || '(no PR description provided)',
    '',
    priorReviewSection,
    '',
    '## Code diff (each line prefixed with its diff position)',
    '',
    '```diff',
    truncatedDiff,
    '```',
    '',
    'Review this submission against the task and rubric. Return only the JSON object.',
  ]
    .filter(Boolean)
    .join('\n');

  // 5. Call Claude
  const { status, body: claudeData } = await callClaude({
    systemPrompt,
    userPrompt,
    apiKey: ANTHROPIC_API_KEY,
  });

  if (status !== 200) {
    console.error(`Anthropic API error ${status}:`, claudeData);

    // Post a holding comment so the candidate isn't left in the dark
    await githubRequest(
      `/repos/${PR_OWNER}/${PR_REPO}/issues/${PR_NUMBER}/comments`,
      GITHUB_TOKEN,
      {
        method: 'POST',
        body: {
          body: [
            '## Assessment review',
            '',
            'We are experiencing a temporary issue with our review system. Your submission has been received — we will post your review shortly.',
            '',
            'No action needed on your part. Please do not remove or re-add the label.',
            '',
            '---',
            '*Reviewed by Jobtern.*',
          ].join('\n'),
        },
      },
    ).catch(() => {});

    process.exit(1);
  }

  const rawText = claudeData.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // 6. Parse Claude response
  let review;
  try {
    const clean = rawText
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/```\s*$/m, '')
      .trim();
    review = JSON.parse(clean);
  } catch (e) {
    console.error('Failed to parse Claude response as JSON:', e.message);
    console.error('Raw response:', rawText);
    process.exit(1);
  }

  // 7. Compute scores
  const p = review.pillars || {};
  const rawTotal = typeof review.total === 'number' ? review.total : 0;
  const adjustedTotal = Math.round(rawTotal * modifier * 10) / 10;
  const hasHardFails = review.hard_fails?.length > 0;
  const rawHireSignal = getHireSignal(rawTotal, hasHardFails);
  const adjustedHireSignal = getHireSignal(adjustedTotal, hasHardFails);
  const allPillarsPass = Object.values(p).every(
    (pillar) => (pillar.score ?? 0) >= 3.0,
  );
  const verdict =
    !hasHardFails && adjustedTotal >= 13 && allPillarsPass
      ? 'APPROVE'
      : 'REQUEST_CHANGES';

  // 8. Separate inline comments into valid and fallback
  const validInlineComments = [];
  const fallbackComments = [];

  for (const c of review.inline_comments || []) {
    const filePositions = positionMap[c.file];
    const position = typeof c.position === 'number' ? c.position : null;
    if (filePositions && position && filePositions.has(position)) {
      validInlineComments.push({ path: c.file, position, body: c.note });
    } else {
      fallbackComments.push(c);
    }
  }

  // 9. Build candidate-facing PR comment
  const trialsLeft = 3 - attemptNumber;
  const attemptLine =
    attemptNumber === 1
      ? `_This is your first submission. You have ${trialsLeft} more trial${trialsLeft === 1 ? '' : 's'}._`
      : attemptNumber === 3
        ? '_This is your 3rd and final submission._'
        : `_This is your ${ordinal(attemptNumber)} submission. You have ${trialsLeft} more trial${trialsLeft === 1 ? '' : 's'}. Resubmissions carry a score penalty._`;

  const hardFailSection = hasHardFails
    ? '\n\n### Hard fails\n' + review.hard_fails.map((f) => `- ${f}`).join('\n')
    : '';

  const fallbackSection = fallbackComments.length
    ? '\n\n### Additional notes\n' +
      fallbackComments.map((c) => `**\`${c.file}\`**\n${c.note}`).join('\n\n')
    : '';

  const prComment = [
    '## Assessment review',
    '',
    attemptLine,
    '',
    review.summary,
    hardFailSection,
    fallbackSection,
    '',
    '---',
    `*Reviewed by Jobtern. Verdict: **${verdict}**.*`,
  ].join('\n');

  // 10. Fetch latest commit SHA from PR at runtime
  // PR_HEAD_SHA from the workflow event may not be reachable from the base repo
  // for fork PRs — fetching it directly ensures it's valid
  const prData = await githubRequest(
    `/repos/${PR_OWNER}/${PR_REPO}/pulls/${PR_NUMBER}`,
    GITHUB_TOKEN,
  );
  const latestSha = prData.body?.head?.sha || PR_HEAD_SHA;

  // Post the review body without inline comments first — avoids 422 from invalid positions
  const reviewRes = await githubRequest(
    `/repos/${PR_OWNER}/${PR_REPO}/pulls/${PR_NUMBER}/reviews`,
    GITHUB_TOKEN,
    {
      method: 'POST',
      body: {
        body: prComment,
        event: verdict === 'APPROVE' ? 'APPROVE' : 'REQUEST_CHANGES',
        commit_id: latestSha,
      },
    },
  );

  if (reviewRes.status !== 200) {
    console.error('Failed to post GitHub review:', reviewRes.body);

    await githubRequest(
      `/repos/${PR_OWNER}/${PR_REPO}/issues/${PR_NUMBER}/comments`,
      GITHUB_TOKEN,
      {
        method: 'POST',
        body: {
          body: [
            '## Assessment review',
            '',
            'We are experiencing a temporary issue with our review system. Your submission has been received — we will post your review shortly.',
            '',
            'No action needed on your part. Please do not remove or re-add the label.',
            '',
            '---',
            '*Reviewed by Jobtern.*',
          ].join('\n'),
        },
      },
    ).catch(() => {});

    process.exit(1);
  }

  // Post inline comments separately as individual review comments
  // This avoids bundling them with the review which can cause 422 on fork PRs
  let inlinePosted = 0;
  for (const c of validInlineComments) {
    const commentRes = await githubRequest(
      `/repos/${PR_OWNER}/${PR_REPO}/pulls/${PR_NUMBER}/comments`,
      GITHUB_TOKEN,
      {
        method: 'POST',
        body: {
          body: c.body,
          path: c.path,
          position: c.position,
          commit_id: latestSha,
        },
      },
    ).catch(() => null);

    if (commentRes?.status === 201) inlinePosted++;
  }

  console.log(
    `Review posted. ${inlinePosted} inline comment(s), ${fallbackComments.length} fallback comment(s).`,
  );

  // 11. Manage labels
  const labelToAdd = verdict === 'APPROVE' ? 'approved' : 'changes-requested';
  const labelToRemove =
    verdict === 'APPROVE' ? 'changes-requested' : 'approved';

  await githubRequest(
    `/repos/${PR_OWNER}/${PR_REPO}/issues/${PR_NUMBER}/labels/ready-for-review`,
    GITHUB_TOKEN,
    { method: 'DELETE' },
  ).catch(() => {});

  await githubRequest(
    `/repos/${PR_OWNER}/${PR_REPO}/issues/${PR_NUMBER}/labels/${encodeURIComponent(labelToRemove)}`,
    GITHUB_TOKEN,
    { method: 'DELETE' },
  ).catch(() => {});

  await githubRequest(
    `/repos/${PR_OWNER}/${PR_REPO}/issues/${PR_NUMBER}/labels`,
    GITHUB_TOKEN,
    { method: 'POST', body: { labels: [labelToAdd] } },
  ).catch(() => console.warn(`Could not add label: ${labelToAdd}`));

  // 12. Log to Notion
  if (NOTION_API_KEY && NOTION_DATABASE_ID) {
    const td = p.technical_discipline || {};
    const rel = p.reliability || {};
    const com = p.communication || {};
    const tr = p.team_readiness || {};

    const repoParts = PR_REPO.split('-');
    const client = repoParts[0] || PR_REPO;
    const roleLabel = ROLE.charAt(0).toUpperCase() + ROLE.slice(1);

    const notionRes = await logToNotion({
      apiKey: NOTION_API_KEY,
      databaseId: NOTION_DATABASE_ID,
      data: {
        candidate: PR_AUTHOR,
        client: client.charAt(0).toUpperCase() + client.slice(1),
        role: roleLabel,
        prNumber: Number(PR_NUMBER),
        attempt: attemptNumber,
        assessmentRepo: `https://github.com/${PR_OWNER}/${PR_REPO}`,
        prUrl: `https://github.com/${PR_OWNER}/${PR_REPO}/pull/${PR_NUMBER}`,
        submittedAt: PR_CREATED_AT || new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        verdict,
        hireSignal: rawHireSignal,
        adjustedHireSignal,
        hardFails: (review.hard_fails || []).join(', '),
        scoreModifier: modifier,
        rawTotal,
        adjustedTotal,
        technicalDiscipline: td.score ?? 0,
        reliability: rel.score ?? 0,
        communication: com.score ?? 0,
        teamReadiness: tr.score ?? 0,
        correctness: td.correctness ?? 0,
        craft: td.craft ?? 0,
        scopeAndJudgment: td.scope_and_judgment ?? 0,
        taskCompletion: rel.task_completion ?? 0,
        briefAdherence: rel.brief_adherence ?? 0,
        runnableInstructions: rel.runnable_instructions ?? 0,
        submissionTiming: rel.submission_timing ?? 0,
        commitMessages: com.commit_messages ?? 0,
        prDescription: com.pr_description ?? 0,
        readme: com.readme ?? 0,
        codeDocumentation: com.code_documentation ?? 0,
        codeTransferability: tr.code_transferability ?? 0,
        gitNarrative: tr.git_narrative ?? 0,
        explicitSurfaceArea: tr.explicit_surface_area ?? 0,
        reviewSummary: review.summary || '',
      },
    });

    if (notionRes.status === 200) {
      console.log('Logged to Notion successfully.');
    } else {
      console.warn(
        'Notion logging failed — dumping internal review data for manual recovery:',
      );
      console.warn('--- INTERNAL REVIEW DATA ---');
      console.warn(`Candidate:            ${PR_AUTHOR}`);
      console.warn(`Attempt:              ${ordinal(attemptNumber)}`);
      console.warn(`Score modifier:       ${modifier}`);
      console.warn(`Verdict:              ${verdict}`);
      console.warn(`Hire signal (raw):    ${rawHireSignal}`);
      console.warn(`Hire signal (adj):    ${adjustedHireSignal}`);
      console.warn(`Raw total:            ${rawTotal} / 20`);
      console.warn(`Adjusted total:       ${adjustedTotal} / 20`);
      console.warn(
        `Technical discipline: ${p.technical_discipline?.score ?? 'N/A'}`,
      );
      console.warn(`Reliability:          ${p.reliability?.score ?? 'N/A'}`);
      console.warn(`Communication:        ${p.communication?.score ?? 'N/A'}`);
      console.warn(`Team readiness:       ${p.team_readiness?.score ?? 'N/A'}`);
      if (hasHardFails)
        console.warn(`Hard fails: ${review.hard_fails.join(', ')}`);
      console.warn(`Notion error: ${JSON.stringify(notionRes.body)}`);
      console.warn('----------------------------');
    }
  } else {
    console.warn(
      'NOTION_API_KEY or NOTION_DATABASE_ID not set — skipping Notion logging.',
    );
  }
}

run().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
