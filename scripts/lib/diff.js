// Annotates a raw GitHub PR diff with [pos:N] position markers
// so Claude can reference specific lines in inline comments.
// Also filters noisy files (lock files, generated output) before
// the diff reaches Claude to preserve context window space.

const NOISY_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  'composer.lock',
  'Gemfile.lock',
  'poetry.lock',
  'Cargo.lock',
]);

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

function filterNoisyFiles(annotatedDiff) {
  // Split on diff --git headers, keeping the delimiter
  const chunks = annotatedDiff.split(/(?=^diff --git )/m);
  const filtered = [];
  let skipped = 0;

  for (const chunk of chunks) {
    if (!chunk.trim()) continue;
    const match = chunk.match(/^diff --git a\/.+ b\/(.+)/m);
    if (match) {
      const filename = match[1].split('/').pop();
      if (NOISY_FILES.has(filename)) {
        skipped++;
        continue;
      }
    }
    filtered.push(chunk);
  }

  return { diff: filtered.join(''), skipped };
}

function truncateDiff(annotatedDiff, maxChars = 80_000) {
  if (annotatedDiff.length <= maxChars) return annotatedDiff;
  return (
    annotatedDiff.slice(0, maxChars) +
    '\n\n[diff truncated — evaluate what is visible]'
  );
}

function partitionInlineComments(inlineComments, positionMap) {
  const valid = [];
  const fallback = [];

  for (const c of inlineComments) {
    const filePositions = positionMap[c.file];
    const position = typeof c.position === 'number' ? c.position : null;
    if (filePositions && position && filePositions.has(position)) {
      valid.push({ path: c.file, position, body: c.note });
    } else {
      fallback.push(c);
    }
  }

  return { valid, fallback };
}

module.exports = {
  annotateDiff,
  filterNoisyFiles,
  truncateDiff,
  partitionInlineComments,
};
