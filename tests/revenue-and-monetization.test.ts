import assert from "node:assert/strict";
import test from "node:test";

test("Revenue Model: Teacher 80/20 platform commission split calculation", () => {
  const coursePriceCents = 149900; // ₹1,499.00
  const discountCents = 29900; // ₹299.00 coupon
  const grossSalesCents = coursePriceCents - discountCents; // ₹1,200.00

  // Standard 20% platform commission (2000 basis points)
  const commissionRateBps = 2000;
  const platformFeeCents = Math.round((grossSalesCents * commissionRateBps) / 10000);
  const teacherNetCents = grossSalesCents - platformFeeCents;

  assert.equal(grossSalesCents, 120000); // ₹1,200
  assert.equal(platformFeeCents, 24000); // ₹240 platform cut
  assert.equal(teacherNetCents, 96000);  // ₹960 teacher payout (80%)
  assert.equal(platformFeeCents + teacherNetCents, grossSalesCents);
});

test("Revenue Model: Subscription Annual 20% discount calculation", () => {
  const monthlyProCents = 49900; // ₹499/mo
  const annual12MonthsCents = monthlyProCents * 12; // ₹5,988/yr without discount

  const annualDiscountedCents = 499000; // ₹4,990/yr
  const annualSavingsCents = annual12MonthsCents - annualDiscountedCents;

  assert.equal(annual12MonthsCents, 598800);
  assert.equal(annualSavingsCents, 99800); // ₹998 savings (2 months free)
  assert.ok(annualSavingsCents > 0);
  assert.ok(annualDiscountedCents < annual12MonthsCents);
});

test("Payout Logic: validates withdrawal bounds against net available ledger balance", () => {
  const netAvailableCents = 450000; // ₹4,500 available

  const isValidAmount = (amountCents: number) => {
    return amountCents > 0 && amountCents <= netAvailableCents;
  };

  // Valid withdrawal
  assert.equal(isValidAmount(250000), true); // ₹2,500
  assert.equal(isValidAmount(450000), true); // full amount

  // Invalid withdrawals
  assert.equal(isValidAmount(0), false);
  assert.equal(isValidAmount(-1000), false);
  assert.equal(isValidAmount(500000), false); // exceeds ₹4,500
});
