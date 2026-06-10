import { expect, test } from "@playwright/test";
import { credentialsFor, loginAs } from "./helpers";

test("student can submit a PDF assignment", async ({ page }) => {
  test.skip(
    !credentialsFor("student").email || !credentialsFor("student").password,
    "Set student E2E credentials and seed at least one visible assignment."
  );

  await loginAs(page, "student");
  await page.goto("/learning/assignments");
  await expect(page.getByRole("heading", { name: "Assignment inbox" })).toBeVisible();

  const submitButton = page.getByRole("button", { name: /Submit PDF|Resubmit PDF/ }).first();
  if ((await submitButton.count()) === 0) {
    test.skip(true, "No assignment is currently available to this student.");
  }

  const form = submitButton.locator("xpath=ancestor::form");
  await form.locator('input[type="file"]').setInputFiles({
    name: "playwright-assignment.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n% AURA Playwright assignment\n%%EOF"),
  });
  await submitButton.click();
  await expect(page.getByText(/submitted successfully|Submission received/i).first()).toBeVisible();
});
