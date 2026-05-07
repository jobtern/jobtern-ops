# Role Patch — Data Engineer

This patch extends the base rubric for data engineering submissions. Read the base rubric first.

A data engineering submission is a pipeline, transformation, or data system built against a described dataset and business question. The primary deliverable is a process that moves, transforms, or aggregates data reliably and correctly.

The key signals for data engineering: does the pipeline produce the same correct result every time it runs, does it handle the messiness of real data, and does the candidate understand the difference between data that looks right and data that is right.

---

## Domain vocabulary examples

Generic (lower score) → domain-aligned (higher score):
- `process_data` → `settle_daily_transactions`, `aggregate_payment_volume`
- `input_file` → `raw_transaction_log`, `incoming_payment_batch`
- `output` → `settled_payment_summary`, `daily_volume_report`
- `clean_data` → `deduplicate_transactions`, `normalise_payment_amounts`
- `run` → `execute_settlement_pipeline`, `process_payment_batch`
- Column named `val` → `amount_kobo`, `transaction_amount`, `payment_value`

---

## Edge case awareness — data engineering-specific

Check these in addition to the universal edge cases:

- What happens when the pipeline runs twice on the same input — does it produce duplicate output, or is it idempotent?
- What happens when a record has a null value in a field that the transformation depends on — is it silently dropped, propagated, or handled explicitly?
- What happens when a numeric field contains a value at an unexpected precision — a float where an integer is expected?
- What happens when the source data contains duplicate records — are they deduplicated, and at the right grain?
- What happens when the dataset is empty — does the pipeline fail, produce an empty output, or handle it gracefully?
- Does the seed or test data include messy values — nulls, duplicates, out-of-order timestamps, boundary amounts?

---

## Git narrative — expected organic sequence

For a data engineering submission: schema or data model first, then ingestion or source reading, then transformation logic, then output writing, then validation or testing. Transformation logic committed before the schema it depends on is a signal.

---

## Hard fails — data engineering additions

These are added to the universal hard fails. Any one triggers REQUEST_CHANGES immediately.

- Pipeline produces different results when run twice on the same input (non-idempotent) without acknowledgment
- Monetary or numeric amounts stored or computed as floats where integer precision is required
- Aggregation computed at the wrong grain — summing before deduplicating, or grouping by the wrong key
- Silent data loss — records dropped without logging, counting, or acknowledgment
- Schema assumptions that cause the pipeline to fail on the first record with a null or unexpected value

---

## Scored deductions — data engineering additions

Flag as inline comments, not hard fails:

- No handling of null values in fields the transformation depends on — deduct under 2.4 Edge Case Awareness
- Seed or test data contains only clean, complete records with no edge case values — deduct under 2.4 Edge Case Awareness
- Transformation logic duplicated across multiple steps instead of extracted — deduct under 2.3 Proportional Complexity
- Output schema not documented — a teammate cannot integrate with the output without reading the code — deduct under 3.2 README Ownership
- Hard-coded file paths or connection strings — deduct under 1.2 Scope Judgment
- No validation of output — pipeline produces output without verifying it meets the expected shape or constraints — deduct under 2.4 Edge Case Awareness
