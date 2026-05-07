// Claude API call with retry logic on 429/529.

const https = require('https');

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 2048;
const MAX_RETRIES = 4;
const BASE_DELAY_MS = 10_000;

async function callClaude({ systemPrompt, userPrompt, apiKey }) {
  const payload = JSON.stringify({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
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
            } catch {
              reject(new Error(`Failed to parse Claude response: ${body}`));
            }
          });
        },
      );
      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    const shouldRetry =
      (result.status === 429 || result.status === 529) && attempt < MAX_RETRIES;

    if (shouldRetry) {
      const delay = BASE_DELAY_MS * attempt;
      console.log(
        `Anthropic API ${result.status} — retrying in ${delay / 1000}s (attempt ${attempt}/${MAX_RETRIES})...`,
      );
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    return result;
  }
}

function extractText(claudeData) {
  return claudeData.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

function parseReview(rawText) {
  const clean = rawText
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/```\s*$/m, '')
    .trim();
  return JSON.parse(clean);
}

module.exports = { callClaude, extractText, parseReview };
