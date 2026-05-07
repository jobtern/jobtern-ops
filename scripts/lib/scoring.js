// Score modifiers, hire signals, verdict computation, and utilities.

function getModifier(attemptNumber) {
  if (attemptNumber === 1) return 1.0;
  if (attemptNumber === 2) return 0.95;
  return 0.9;
}

// Total is a percentage (0–100).
function getHireSignal(total, hasHardFails) {
  if (hasHardFails || total < 50) return 'no';
  if (total < 65) return 'weak';
  if (total < 85) return 'moderate';
  return 'strong';
}

// Verdict: APPROVE if adjusted total ≥ 65 AND no pillar < 60 AND no hard fails.
function computeVerdict({ adjustedTotal, pillars, hasHardFails }) {
  const allPillarsPass = Object.values(pillars).every(
    (pillar) => (pillar.score ?? 0) >= 60,
  );
  return !hasHardFails && adjustedTotal >= 65 && allPillarsPass
    ? 'APPROVE'
    : 'REQUEST_CHANGES';
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

module.exports = { getModifier, getHireSignal, computeVerdict, ordinal };
