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
  const fb = review.feedback || {};
  const hasHardFails = review.hard_fails?.length > 0;

  // Use Claude-provided feedback strings when available
  const strengths = fb.strengths?.length
    ? fb.strengths.map((s) => `- ${s}`).join('\n')
    : '- The submission showed effort and engagement with the task.';

  const improvements = hasHardFails
    ? review.hard_fails.map((f) => `- ${f}`).join('\n')
    : fb.improvements?.length
      ? fb.improvements.map((i) => `- ${i}`).join('\n')
      : '- The submission fell just short of the overall threshold.';

  const nextTime = fb.next_time?.length
    ? fb.next_time.map((n) => `- ${n}`).join('\n')
    : [
        '- Write commits that tell the story of how you built it, not just what changed.',
        '- Document decisions in the `README`, not just setup instructions.',
        '- Read constraints carefully and verify your output satisfies every layer before submitting.',
      ].join('\n');

  return [
    '**What worked**',
    strengths,
    '',
    '**What held it back**',
    improvements,
    '',
    '**Next time**',
    nextTime,
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
  const isApproved = verdict === 'APPROVE';

  const hardFailSection = hasHardFails
    ? '\n**Hard fails**\n' +
      review.hard_fails.map((f) => `- \`${f}\``).join('\n')
    : '';

  const fallbackSection = fallbackComments.length
    ? '\n**Additional notes**\n' +
      fallbackComments.map((c) => `**\`${c.file}\`**\n${c.note}`).join('\n\n')
    : '';

  // Final attempt, not approved
  if (isFinalUnapproved) {
    const priorApprovalNote = hadPriorApproval
      ? '\nYour final submission did not meet the approval threshold. We will use your previously approved submission for evaluation.\n'
      : '';

    return {
      body: [
        "### Here's where this lands.",
        '',
        '_This is your 3rd and final submission. No further reviews will run on this PR._',
        priorApprovalNote,
        review.summary,
        '',
        buildStructuredFeedback(review),
        '',
        '*Reviewed by Jobtern.*',
      ]
        .filter(Boolean)
        .join('\n'),
      event: 'COMMENT',
    };
  }

  // Approved
  if (isApproved) {
    return {
      body: [
        '### Good work.',
        '',
        buildAttemptLine(attemptNumber),
        '',
        review.summary,
        fallbackSection,
      ]
        .filter(Boolean)
        .join('\n'),
      event: 'APPROVE',
    };
  }

  // Changes requested (attempts 1 or 2)
  return {
    body: [
      '### You have feedback.',
      '',
      buildAttemptLine(attemptNumber),
      '',
      review.summary,
      hardFailSection,
      fallbackSection,
    ]
      .filter(Boolean)
      .join('\n'),
    event: 'REQUEST_CHANGES',
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
    'Inline comment notes should use markdown where appropriate:',
    '- Wrap filenames and paths in backticks: `src/index.ts`',
    '- Wrap variable names, function names, and code references in backticks: `amount`, `calculateTotal()`',
    '- Use **bold** for emphasis on critical issues',
    '',
    'Return ONLY valid JSON — no prose, no markdown fences, no explanation outside the JSON object.',
    '',
    'The "summary" field must follow these rules:',
    '- Write in short paragraphs separated by blank lines, not as a single block of text',
    '- Lead with an overall read of the submission, then observations, then concerns',
    '- Never reference the candidate\'s seniority or experience level — no "junior", "for a junior", "given their level", or similar qualifiers',
    '- Use backticks for all code references, filenames, and variable names',
    '',
    'The JSON must follow this exact shape:',
    '{',
    '  "summary": "string — short paragraphs separated by \\n\\n, backticks for code references",',
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
    '  "feedback": {',
    '    "strengths": ["string — specific observed behaviour, backticks for code references, 1–3 items"],',
    '    "improvements": ["string — specific observed behaviour, backticks for code references, 1–3 items"],',
    '    "next_time": ["string — forward-looking, actionable, no rubric language, 1–3 items"]',
    '  },',
    '  "hard_fails": ["string — plain text, no markdown"],',
    '  "inline_comments": [{ "file": "string", "position": number, "note": "string — use markdown for code references" }]',
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

function buildUserPrompt({ prTitle, prBody, priorReviews, truncatedDiff }) {
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
    '## Candidate PR',
    '',
    `**Title:** ${prTitle || '(no title)'}`,
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
