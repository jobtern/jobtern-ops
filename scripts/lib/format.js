// Builds all candidate-facing text: PR comments, structured feedback, prompts.

const { ordinal } = require('./scoring');

function buildAttemptLine(attemptNumber) {
  const trialsLeft = 3 - attemptNumber;
  if (attemptNumber === 1)
    return `_This is your first submission. You have ${trialsLeft} more trial${trialsLeft === 1 ? '' : 's'}._`;
  if (attemptNumber === 2)
    return `_This is your ${ordinal(attemptNumber)} submission. You have ${trialsLeft} more trial. Resubmissions carry a score penalty._`;
  return '_This is your 3rd and final submission. No further reviews will run on this PR._';
}

function buildStructuredFeedback(review) {
  const dq = review.pillars?.decision_quality || {};
  const bi = review.pillars?.build_integrity || {};
  const ow = review.pillars?.ownership || {};
  const hasHardFails = review.hard_fails?.length > 0;

  const strengths = [];
  if ((dq.score ?? 0) >= 65)
    strengths.push(
      'Decision quality — constraints were met and ambiguity was handled deliberately.',
    );
  if ((bi.score ?? 0) >= 65)
    strengths.push(
      'Build integrity — the implementation was consistent and appropriately scoped.',
    );
  if ((ow.score ?? 0) >= 65)
    strengths.push(
      'Ownership — git history, README, and documented decisions showed clear authorship.',
    );

  const gaps = [];
  if (!hasHardFails) {
    if ((dq.score ?? 0) < 60)
      gaps.push(
        'Decision quality — constraints were missed or ambiguity was left unresolved.',
      );
    if ((bi.score ?? 0) < 60)
      gaps.push(
        'Build integrity — inconsistent seams, mismatched naming, or over-engineered structure.',
      );
    if ((ow.score ?? 0) < 60)
      gaps.push(
        'Ownership — git history, README, or absence documentation was insufficient.',
      );
  }

  return [
    '## Assessment feedback',
    '',
    review.summary,
    '',
    '### What worked',
    strengths.length > 0
      ? strengths.map((s) => `- ${s}`).join('\n')
      : '- The submission showed effort and engagement with the task.',
    '',
    '### What held it back',
    hasHardFails
      ? review.hard_fails.map((f) => `- ${f}`).join('\n')
      : gaps.length > 0
        ? gaps.map((g) => `- ${g}`).join('\n')
        : '- The submission fell just short of the overall threshold.',
    '',
    '### Areas to develop',
    '- Write commits that tell the story of how you built it — not just what changed.',
    '- Document decisions in the README, not just setup instructions.',
    '- Read constraints carefully and verify your output satisfies every layer before submitting.',
  ].join('\n');
}

function buildPrComment({
  review,
  verdict,
  attemptNumber,
  hadPriorApproval,
  fallbackComments,
  isFinalUnapproved,
}) {
  const hasHardFails = review.hard_fails?.length > 0;

  const hardFailSection = hasHardFails
    ? '\n\n### Hard fails\n' + review.hard_fails.map((f) => `- ${f}`).join('\n')
    : '';

  const fallbackSection = fallbackComments.length
    ? '\n\n### Additional notes\n' +
      fallbackComments.map((c) => `**\`${c.file}\`**\n${c.note}`).join('\n\n')
    : '';

  if (isFinalUnapproved) {
    const priorApprovalNote = hadPriorApproval
      ? '\nYour final submission did not meet the approval threshold. We will use your previously approved submission for evaluation.\n'
      : '';
    return {
      body: [
        '## Assessment complete',
        '',
        '_This is your 3rd and final submission. No further reviews will run on this PR._',
        priorApprovalNote,
        buildStructuredFeedback(review),
        '',
        '---',
        '*Reviewed by Jobtern.*',
      ]
        .filter(Boolean)
        .join('\n'),
      event: 'COMMENT',
    };
  }

  return {
    body: [
      '## Assessment review',
      '',
      buildAttemptLine(attemptNumber),
      '',
      review.summary,
      hardFailSection,
      fallbackSection,
      '',
      '---',
      `*Reviewed by Jobtern. Verdict: **${verdict}**.*`,
    ].join('\n'),
    event: verdict === 'APPROVE' ? 'APPROVE' : 'REQUEST_CHANGES',
  };
}

function buildSystemPrompt(task, rubric) {
  return [
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
    'The JSON must follow this exact shape:',
    '{',
    '  "summary": "string",',
    '  "total": number (0–100, percentage),',
    '  "pillars": {',
    '    "decision_quality": {',
    '      "score": number (0–100),',
    '      "constraint_fidelity": number (0–10),',
    '      "scope_judgment": number (0–10),',
    '      "open_question_response": number (0–10)',
    '    },',
    '    "build_integrity": {',
    '      "score": number (0–100),',
    '      "seam_consistency": number (0–10),',
    '      "domain_vocabulary": number (0–10),',
    '      "proportional_complexity": number (0–10),',
    '      "edge_case_awareness": number (0–10)',
    '    },',
    '    "ownership": {',
    '      "score": number (0–100),',
    '      "git_narrative": number (0–10),',
    '      "readme_ownership": number (0–10),',
    '      "absence_acknowledgment": number (0–10)',
    '    }',
    '  },',
    '  "hard_fails": ["string"],',
    '  "inline_comments": [{ "file": "string", "position": number, "note": "string" }]',
    '}',
    '',
    '## Task',
    '',
    task,
    '',
    '## Rubric',
    '',
    rubric,
  ].join('\n');
}

function buildUserPrompt({ prBody, priorReviews, truncatedDiff }) {
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

  return [
    '## Candidate PR description',
    '',
    prBody || '(no PR description provided)',
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
}

module.exports = {
  buildAttemptLine,
  buildStructuredFeedback,
  buildPrComment,
  buildSystemPrompt,
  buildUserPrompt,
};
