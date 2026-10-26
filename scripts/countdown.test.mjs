// Tests for countdown.mjs. Plain node:test, no dependencies:
//   node --test scripts/countdown.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daysUntil, countdownState } from './countdown.mjs';

test('counts Israel calendar days', () => {
  assert.equal(daysUntil('2027-01-12', new Date('2026-10-25T09:00:00Z')), 79);
  assert.equal(daysUntil('2026-12-15', new Date('2026-10-25T09:00:00Z')), 51);
  assert.equal(daysUntil('2027-06-14', new Date('2026-10-25T09:00:00Z')), 232);
});
test('uses the Israel date after local midnight, not the UTC date', () => {
  // 2026-10-25 22:30 UTC is 00:30 on 2026-10-26 in Israel (UTC+2 after DST ends)
  assert.equal(daysUntil('2027-01-12', new Date('2026-10-25T22:30:00Z')), 78);
});
test('exam day is 0 and the day after is negative', () => {
  assert.equal(daysUntil('2027-01-12', new Date('2027-01-12T05:00:00Z')), 0);
  assert.equal(daysUntil('2027-01-12', new Date('2027-01-13T05:00:00Z')), -1);
});
test('state', () => {
  assert.equal(countdownState(79), 'future');
  assert.equal(countdownState(0), 'today');
  assert.equal(countdownState(-1), 'past');
});
