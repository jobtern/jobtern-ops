// Score modifiers, hire signals, verdict computation, deadline checking, and utilities.

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

// Converts an ISO deadline string ("YYYY-MM-DDT20:00") + IANA timezone
// into a UTC Date object representing 20:00 in that timezone on that date.
// Handles fractional timezone offsets (e.g. India +5:30, Nepal +5:45).
function getDeadlineUTC(isoDeadline, candidateTz) {
  const [datePart, timePart] = isoDeadline.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  // Use noon UTC on the deadline date as a reference point to find the timezone offset.
  // Noon is safe — it avoids DST transitions which typically happen at midnight or 2am.
  const utcNoon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: candidateTz,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(utcNoon);

  const localHour = parseInt(parts.find((p) => p.type === 'hour').value);
  const localMinute = parseInt(parts.find((p) => p.type === 'minute').value);

  // Offset in minutes between local timezone and UTC at that date
  const offsetMinutes = localHour * 60 + localMinute - 720; // 720 = noon in minutes

  // Target local time converted to UTC minutes from midnight of the deadline date
  const targetUTCMinutes = hour * 60 + minute - offsetMinutes;

  // Date.UTC handles overflow/underflow across day boundaries correctly
  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      Math.floor(targetUTCMinutes / 60),
      targetUTCMinutes % 60,
      0,
    ),
  );
}

// Returns the deadline as a WAT-offset ISO string for Notion display.
// WAT is UTC+1 with no DST — always a fixed offset.
// e.g. "2026-05-13T21:00:00.000+01:00"
function getDeadlineWAT(isoDeadline, candidateTz) {
  const utc = getDeadlineUTC(isoDeadline, candidateTz);
  const wat = new Date(utc.getTime() + 60 * 60 * 1000); // shift +1 hour
  return wat.toISOString().replace('Z', '+01:00');
}

// Returns true if the PR was created before the deadline, false if late,
// or null if deadline data is missing (e.g. older assessment repos).
function isSubmissionOnTime(prCreatedAt, isoDeadline, candidateTz) {
  if (!prCreatedAt || !isoDeadline || !candidateTz) return null;
  try {
    const submittedAt = new Date(prCreatedAt);
    const deadlineUTC = getDeadlineUTC(isoDeadline, candidateTz);
    return submittedAt <= deadlineUTC;
  } catch {
    return null;
  }
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

module.exports = {
  getModifier,
  getHireSignal,
  computeVerdict,
  getDeadlineUTC,
  getDeadlineWAT,
  isSubmissionOnTime,
  ordinal,
};
