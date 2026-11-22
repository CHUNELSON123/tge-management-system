import test from "node:test";
import assert from "node:assert/strict";
import { enrollmentBlock, FOUNDATION_CODE, MENTORING_CODE, progressionFor, SECOND_STAGE_CODES } from "./progression.js";

const record = (code: string, enrolledAt: string, completedAt: string | null, status = "completed") => ({ status, enrolledAt: new Date(enrolledAt), completedAt: completedAt ? new Date(completedAt) : null, cohort: { programme: { code } } });
const foundation = record(FOUNDATION_CODE, "2026-01-01", "2026-02-01");

test("progression requires recorded Foundation and a second-stage enrollment after it", () => {
  const none = progressionFor([]);
  assert.equal(enrollmentBlock(FOUNDATION_CODE, none), null);
  assert.equal(enrollmentBlock(SECOND_STAGE_CODES[0], none), "FOUNDATION_REQUIRED");
  assert.equal(enrollmentBlock(null, none), "FOUNDATION_REQUIRED");
  assert.equal(progressionFor([record(FOUNDATION_CODE, "2026-01-01", null)]).foundationComplete, false);
  const base = progressionFor([foundation]);
  assert.equal(enrollmentBlock(SECOND_STAGE_CODES[0], base), null);
  assert.equal(enrollmentBlock(MENTORING_CODE, base), "SECOND_STAGE_REQUIRED");
  for (const code of SECOND_STAGE_CODES) {
    assert.equal(progressionFor([foundation, record(code, "2026-02-02", "2026-03-01")]).secondStageComplete, true);
    assert.equal(progressionFor([foundation, record(code, "2026-01-15", "2026-03-01")]).secondStageComplete, false);
    assert.equal(progressionFor([foundation, record(code, "2026-02-02", null, "enrolled")]).secondStageComplete, false);
    assert.equal(progressionFor([foundation, record(code, "2026-03-02", "2026-03-01")]).secondStageComplete, false);
  }
});
