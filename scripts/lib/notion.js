// Logs a completed review to the Notion "Candidate Reviews" database.

const https = require('https');
const { ordinal } = require('./scoring');

// Converts any UTC ISO string to a WAT-offset ISO string (UTC+1, no DST).
// e.g. "2026-05-08T14:23:00Z" → "2026-05-08T15:23:00.000+01:00"
function toWAT(utcIsoString) {
  const wat = new Date(new Date(utcIsoString).getTime() + 60 * 60 * 1000);
  return wat.toISOString().replace('Z', '+01:00');
}

async function logToNotion({ apiKey, databaseId, data }) {
  const properties = {
    Candidate: { title: [{ text: { content: data.candidate } }] },
    Client: { rich_text: [{ text: { content: data.client } }] },
    Role: { select: { name: data.role } },
    Attempt: { number: data.attempt },
    'PR URL': { url: data.prUrl },
    Verdict: { select: { name: data.verdict } },
    'Hire signal': { select: { name: data.hireSignal } },
    'Adjusted hire signal': { select: { name: data.adjustedHireSignal } },
    'Hard fails': { rich_text: [{ text: { content: data.hardFails } }] },
    'Score modifier': { number: data.scoreModifier },
    'Raw total': { number: data.rawTotal },
    'Adjusted total': { number: data.adjustedTotal },
    // Pillar scores (0–100)
    'Decision quality': { number: data.decisionQuality },
    'Build integrity': { number: data.buildIntegrity },
    Ownership: { number: data.ownership },
    // Decision Quality sub-dimensions (0–10)
    'Constraint fidelity': { number: data.constraintFidelity },
    'Scope judgment': { number: data.scopeJudgment },
    'Open question response': { number: data.openQuestionResponse },
    // Build Integrity sub-dimensions (0–10)
    'Seam consistency': { number: data.seamConsistency },
    'Domain vocabulary': { number: data.domainVocabulary },
    'Proportional complexity': { number: data.proportionalComplexity },
    'Edge case awareness': { number: data.edgeCaseAwareness },
    // Ownership sub-dimensions (0–10)
    'Git narrative': { number: data.gitNarrative },
    'README ownership': { number: data.readmeOwnership },
    'Absence acknowledgment': { number: data.absenceAcknowledgment },
    'Review summary': {
      rich_text: [{ text: { content: data.reviewSummary.slice(0, 2000) } }],
    },
  };

  // Deadline tracking — all times in WAT, omitted for older repos without deadline data
  if (data.submittedAtWAT) {
    properties['Submitted at (WAT)'] = { date: { start: data.submittedAtWAT } };
  }
  if (data.deadlineWAT) {
    properties['Deadline (WAT)'] = { date: { start: data.deadlineWAT } };
  }
  if (data.onTime !== null && data.onTime !== undefined) {
    properties['On time'] = { checkbox: data.onTime };
  }

  const payload = JSON.stringify({
    parent: { database_id: databaseId },
    properties,
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
          } catch {
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

function dumpToConsole({ data, review, pillars, hasHardFails }) {
  const { dq, bi, ow } = pillars;
  console.warn(
    'Notion logging failed — dumping internal review data for manual recovery:',
  );
  console.warn('--- INTERNAL REVIEW DATA ---');
  console.warn(`Candidate:                ${data.candidate}`);
  console.warn(`Attempt:                  ${ordinal(data.attempt)}`);
  console.warn(`Score modifier:           ${data.scoreModifier}`);
  console.warn(`Verdict:                  ${data.verdict}`);
  console.warn(`Hire signal (raw):        ${data.hireSignal}`);
  console.warn(`Hire signal (adj):        ${data.adjustedHireSignal}`);
  console.warn(`Raw total:                ${data.rawTotal}%`);
  console.warn(`Adjusted total:           ${data.adjustedTotal}%`);
  console.warn(`Submitted at (WAT):       ${data.submittedAtWAT ?? 'N/A'}`);
  console.warn(`Deadline (WAT):           ${data.deadlineWAT ?? 'N/A'}`);
  console.warn(`On time:                  ${data.onTime ?? 'N/A'}`);
  console.warn(`Decision quality:         ${dq.score ?? 'N/A'}%`);
  console.warn(`  Constraint fidelity:    ${dq.constraint_fidelity ?? 'N/A'}`);
  console.warn(`  Scope judgment:         ${dq.scope_judgment ?? 'N/A'}`);
  console.warn(
    `  Open question response: ${dq.open_question_response ?? 'N/A'}`,
  );
  console.warn(`Build integrity:          ${bi.score ?? 'N/A'}%`);
  console.warn(`  Seam consistency:       ${bi.seam_consistency ?? 'N/A'}`);
  console.warn(`  Domain vocabulary:      ${bi.domain_vocabulary ?? 'N/A'}`);
  console.warn(
    `  Proportional complexity:${bi.proportional_complexity ?? 'N/A'}`,
  );
  console.warn(`  Edge case awareness:    ${bi.edge_case_awareness ?? 'N/A'}`);
  console.warn(`Ownership:                ${ow.score ?? 'N/A'}%`);
  console.warn(`  Git narrative:          ${ow.git_narrative ?? 'N/A'}`);
  console.warn(`  README ownership:       ${ow.readme_ownership ?? 'N/A'}`);
  console.warn(
    `  Absence acknowledgment: ${ow.absence_acknowledgment ?? 'N/A'}`,
  );
  if (hasHardFails) console.warn(`Hard fails: ${review.hard_fails.join(', ')}`);
  console.warn('----------------------------');
}

module.exports = { logToNotion, dumpToConsole, toWAT };
