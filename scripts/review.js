// Entry point — orchestration only. No logic lives here.
// Each step delegates to a focused module in lib/.

const {
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
} = require('./lib/github');

const { callClaude, extractText, parseReview } = require('./lib/claude');
const {
  annotateDiff,
  filterNoisyFiles,
  truncateDiff,
  partitionInlineComments,
} = require('./lib/diff');
const {
  getModifier,
  getHireSignal,
  computeVerdict,
  getDeadlineWAT,
  isSubmissionOnTime,
  ordinal,
} = require('./lib/scoring');
const {
  buildSystemPrompt,
  buildUserPrompt,
  buildPrComment,
} = require('./lib/format');
const { logToNotion, dumpToConsole, toWAT } = require('./lib/notion');

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
    PR_AUTHOR,
    PR_CREATED_AT,
    PR_TITLE,
    DEADLINE,
    CANDIDATE_TZ,
  } = process.env;

  if (!ROLE) {
    console.error('ROLE is not set. Run new-assessment.sh to configure it.');
    process.exit(1);
  }

  // ── 1. Attempt count ────────────────────────────────────────────────────────
  const priorReviews = await fetchPriorReviews(
    PR_OWNER,
    PR_REPO,
    PR_NUMBER,
    GITHUB_TOKEN,
  );
  const attemptNumber = priorReviews.length + 1;
  const modifier = getModifier(attemptNumber);
  console.log(`Attempt: ${ordinal(attemptNumber)} | Modifier: ${modifier}`);

  // ── 2. Gate: check ready-for-review label ───────────────────────────────────
  const labels = await fetchLabels(PR_OWNER, PR_REPO, PR_NUMBER, GITHUB_TOKEN);
  const hasReadyForReview = labels.includes('ready-for-review');
  const hasSubmissionClosed = labels.includes('submission-closed');

  if (!hasReadyForReview) {
    console.log(
      'Submission does not have ready-for-review label — skipping review.',
    );
    return;
  }

  // ── 3. Gate: submission already closed ─────────────────────────────────────
  if (hasSubmissionClosed || priorReviews.length >= 3) {
    // Always remove ready-for-review — candidate may have re-added it trying to trigger another review
    await removeLabel(
      PR_OWNER,
      PR_REPO,
      PR_NUMBER,
      'ready-for-review',
      GITHUB_TOKEN,
    );
    if (!hasSubmissionClosed && priorReviews.length >= 3) {
      await addLabels(
        PR_OWNER,
        PR_REPO,
        PR_NUMBER,
        ['submission-closed'],
        GITHUB_TOKEN,
      );
    }
    console.log('Submission is closed — skipping review.');
    return;
  }

  // ── 4. Clean up conflicting labels when ready-for-review is present ────────
  const labelsToRemove = labels.filter(
    (label) => label !== 'ready-for-review' && label !== 'submission-closed',
  );
  for (const label of labelsToRemove) {
    await removeLabel(PR_OWNER, PR_REPO, PR_NUMBER, label, GITHUB_TOKEN);
  }

  // ── 5. Deadline check ───────────────────────────────────────────────────────
  const onTime = isSubmissionOnTime(PR_CREATED_AT, DEADLINE, CANDIDATE_TZ);
  if (onTime === null) {
    console.warn('Deadline data missing — skipping on-time check.');
  } else {
    console.log(
      `Submission ${onTime ? 'on time' : 'LATE'} (deadline: ${DEADLINE} ${CANDIDATE_TZ})`,
    );
  }

  // Convert both timestamps to WAT for Notion display
  const submittedAtWAT = PR_CREATED_AT ? toWAT(PR_CREATED_AT) : null;
  const deadlineWAT =
    DEADLINE && CANDIDATE_TZ ? getDeadlineWAT(DEADLINE, CANDIDATE_TZ) : null;

  // ── 6. Fetch rubric (base + role patch) and task ────────────────────────────
  console.log('Fetching rubric...');
  const [baseRubric, rolePatch, task] = await Promise.all([
    fetchRepoFile('jobtern', 'jobtern-ops', 'rubrics/base.md', GITHUB_TOKEN),
    fetchRepoFile(
      'jobtern',
      'jobtern-ops',
      `rubrics/patches/${ROLE}.md`,
      GITHUB_TOKEN,
    ),
    fetchRepoFile(PR_OWNER, PR_REPO, 'TASK.md', GITHUB_TOKEN),
  ]);
  const rubric = `${baseRubric}\n\n---\n\n${rolePatch}`;

  // ── 7. Fetch and annotate diff ──────────────────────────────────────────────
  const rawDiff = await fetchDiff(PR_OWNER, PR_REPO, PR_NUMBER, GITHUB_TOKEN);
  const { annotatedDiff, positionMap } = annotateDiff(rawDiff);
  const { diff: filteredDiff, skipped } = filterNoisyFiles(annotatedDiff);
  if (skipped > 0) console.log(`Filtered ${skipped} noisy file(s) from diff.`);
  const diff = truncateDiff(filteredDiff);

  // ── 8. Build prompts and call Claude ────────────────────────────────────────
  const systemPrompt = buildSystemPrompt(task, rubric);
  const userPrompt = buildUserPrompt({
    prTitle: PR_TITLE,
    prBody: PR_BODY,
    priorReviews,
    truncatedDiff: diff,
  });

  const { status, body: claudeData } = await callClaude({
    systemPrompt,
    userPrompt,
    apiKey: ANTHROPIC_API_KEY,
  });

  if (status !== 200) {
    console.error(`Anthropic API error ${status}:`, claudeData);
    await postComment(
      PR_OWNER,
      PR_REPO,
      PR_NUMBER,
      HOLDING_COMMENT,
      GITHUB_TOKEN,
    ).catch(() => {});
    process.exit(1);
  }

  // ── 9. Parse Claude response ────────────────────────────────────────────────
  let review;
  try {
    review = parseReview(extractText(claudeData));
  } catch (e) {
    console.error('Failed to parse Claude response as JSON:', e.message);
    process.exit(1);
  }

  // ── 10. Compute scores and verdict ───────────────────────────────────────────
  const pillars = review.pillars || {};
  const dq = pillars.decision_quality || {};
  const bi = pillars.build_integrity || {};
  const ow = pillars.ownership || {};

  const rawTotal = typeof review.total === 'number' ? review.total : 0;
  const adjustedTotal = Math.round(rawTotal * modifier * 10) / 10;
  const hasHardFails = (review.hard_fails?.length ?? 0) > 0;
  const rawHireSignal = getHireSignal(rawTotal, hasHardFails);
  const adjustedHireSignal = getHireSignal(adjustedTotal, hasHardFails);
  const verdict = computeVerdict({ adjustedTotal, pillars, hasHardFails });

  // ── 11. Partition inline comments ────────────────────────────────────────────
  const { valid: validInlineComments, fallback: fallbackComments } =
    partitionInlineComments(review.inline_comments || [], positionMap);

  // ── 12. Build and post review ───────────────────────────────────────────────
  const hadPriorApproval = priorReviews.some((r) => r.state === 'APPROVED');
  const isFinalUnapproved =
    attemptNumber === 3 && verdict === 'REQUEST_CHANGES';

  const { body: prCommentBody, event: reviewEvent } = buildPrComment({
    review,
    verdict,
    attemptNumber,
    hadPriorApproval,
    fallbackComments,
    isFinalUnapproved,
  });

  const latestSha = await fetchLatestSha(
    PR_OWNER,
    PR_REPO,
    PR_NUMBER,
    PR_HEAD_SHA,
    GITHUB_TOKEN,
  );

  const reviewRes = await postReview(
    PR_OWNER,
    PR_REPO,
    PR_NUMBER,
    { body: prCommentBody, event: reviewEvent, commitId: latestSha },
    GITHUB_TOKEN,
  );

  if (reviewRes.status !== 200) {
    console.error('Failed to post GitHub review:', reviewRes.body);
    await postComment(
      PR_OWNER,
      PR_REPO,
      PR_NUMBER,
      HOLDING_COMMENT,
      GITHUB_TOKEN,
    ).catch(() => {});
    process.exit(1);
  }

  // Post inline comments individually to avoid 422s on fork PRs
  let inlinePosted = 0;
  for (const c of validInlineComments) {
    const res = await postInlineComment(
      PR_OWNER,
      PR_REPO,
      PR_NUMBER,
      { body: c.body, path: c.path, position: c.position, commitId: latestSha },
      GITHUB_TOKEN,
    );
    if (res?.status === 201) inlinePosted++;
  }

  console.log(
    `Review posted. ${inlinePosted} inline comment(s), ${fallbackComments.length} fallback comment(s).`,
  );

  // ── 13. Manage labels ────────────────────────────────────────────────────────
  await removeLabel(
    PR_OWNER,
    PR_REPO,
    PR_NUMBER,
    'ready-for-review',
    GITHUB_TOKEN,
  );
  await removeLabel(
    PR_OWNER,
    PR_REPO,
    PR_NUMBER,
    'changes-requested',
    GITHUB_TOKEN,
  );
  await removeLabel(PR_OWNER, PR_REPO, PR_NUMBER, 'approved', GITHUB_TOKEN);

  if (isFinalUnapproved) {
    await addLabels(
      PR_OWNER,
      PR_REPO,
      PR_NUMBER,
      ['submission-closed'],
      GITHUB_TOKEN,
    );
  } else if (verdict === 'APPROVE') {
    const labelsToAdd = ['approved'];
    if (attemptNumber >= 3) labelsToAdd.push('submission-closed');
    await addLabels(PR_OWNER, PR_REPO, PR_NUMBER, labelsToAdd, GITHUB_TOKEN);
  } else {
    await addLabels(
      PR_OWNER,
      PR_REPO,
      PR_NUMBER,
      ['changes-requested'],
      GITHUB_TOKEN,
    );
  }

  // ── 14. Log to Notion ────────────────────────────────────────────────────────
  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    console.warn(
      'NOTION_API_KEY or NOTION_DATABASE_ID not set — skipping Notion logging.',
    );
    return;
  }

  const client = PR_REPO.split('-')[0] || PR_REPO;
  const roleLabel = ROLE.charAt(0).toUpperCase() + ROLE.slice(1);

  const notionData = {
    candidate: PR_AUTHOR,
    client: client.charAt(0).toUpperCase() + client.slice(1),
    role: roleLabel,
    attempt: attemptNumber,
    prUrl: `https://github.com/${PR_OWNER}/${PR_REPO}/pull/${PR_NUMBER}`,
    verdict,
    hireSignal: rawHireSignal,
    adjustedHireSignal,
    hardFails: (review.hard_fails || []).join(', '),
    scoreModifier: modifier,
    rawTotal,
    adjustedTotal,
    // Deadline tracking — all times in WAT
    submittedAtWAT,
    deadlineWAT,
    onTime,
    // Pillar scores (0–100)
    decisionQuality: dq.score ?? 0,
    buildIntegrity: bi.score ?? 0,
    ownership: ow.score ?? 0,
    // Decision Quality sub-dimensions (0–10)
    constraintFidelity: dq.constraint_fidelity ?? 0,
    scopeJudgment: dq.scope_judgment ?? 0,
    openQuestionResponse: dq.open_question_response ?? 0,
    // Build Integrity sub-dimensions (0–10)
    seamConsistency: bi.seam_consistency ?? 0,
    domainVocabulary: bi.domain_vocabulary ?? 0,
    proportionalComplexity: bi.proportional_complexity ?? 0,
    edgeCaseAwareness: bi.edge_case_awareness ?? 0,
    // Ownership sub-dimensions (0–10)
    gitNarrative: ow.git_narrative ?? 0,
    readmeOwnership: ow.readme_ownership ?? 0,
    absenceAcknowledgment: ow.absence_acknowledgment ?? 0,
    reviewSummary: review.summary || '',
  };

  const notionRes = await logToNotion({
    apiKey: NOTION_API_KEY,
    databaseId: NOTION_DATABASE_ID,
    data: notionData,
  });

  if (notionRes.status === 200) {
    console.log('Logged to Notion successfully.');
  } else {
    dumpToConsole({
      data: notionData,
      review,
      pillars: { dq, bi, ow },
      hasHardFails,
    });
    console.warn(`Notion error: ${JSON.stringify(notionRes.body)}`);
  }
}

run().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
