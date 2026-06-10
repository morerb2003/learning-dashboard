import assert from "node:assert/strict";
import test from "node:test";
import {
  average,
  buildWeeklyActivity,
  calculateStreak,
  percentage,
} from "../lib/analytics/calculations.ts";

test("average handles empty and populated values", () => {
  assert.equal(average([]), 0);
  assert.equal(average([25, 50, 75]), 50);
});

test("percentage is bounded and handles zero totals", () => {
  assert.equal(percentage(2, 4), 50);
  assert.equal(percentage(3, 0), 0);
  assert.equal(percentage(6, 4), 100);
});

test("streak includes today or falls back to yesterday", () => {
  const reference = new Date("2026-06-10T12:00:00.000Z");
  assert.equal(
    calculateStreak(
      [
        "2026-06-10T08:00:00.000Z",
        "2026-06-09T08:00:00.000Z",
        "2026-06-08T08:00:00.000Z",
      ],
      reference
    ),
    3
  );
  assert.equal(
    calculateStreak(
      ["2026-06-09T08:00:00.000Z", "2026-06-08T08:00:00.000Z"],
      reference
    ),
    2
  );
});

test("weekly activity counts verified events by day", () => {
  const result = buildWeeklyActivity(
    [
      "2026-06-10T08:00:00.000Z",
      "2026-06-10T09:00:00.000Z",
      "2026-06-08T08:00:00.000Z",
    ],
    new Date("2026-06-10T12:00:00.000Z")
  );

  assert.equal(result.length, 7);
  assert.equal(result.at(-1)?.modules, 2);
  assert.equal(result.at(-3)?.modules, 1);
});
