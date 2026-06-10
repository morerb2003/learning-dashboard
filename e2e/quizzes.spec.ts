import { expect, test } from "@playwright/test";
import { credentialsFor, loginAs } from "./helpers";

test("student can complete a published quiz", async ({ page }) => {
  test.skip(
    !credentialsFor("student").email || !credentialsFor("student").password,
    "Set student E2E credentials and seed at least one published quiz."
  );

  await loginAs(page, "student");
  await page.goto("/learning/quizzes");
  await expect(page.getByRole("heading", { name: "Quiz inbox" })).toBeVisible();

  const startQuiz = page.getByRole("link", { name: "Start Quiz" }).first();
  if ((await startQuiz.count()) === 0) {
    test.skip(true, "No published quiz is available to this student.");
  }

  await startQuiz.click();
  await expect(page.getByRole("heading", { name: "Take Quiz" })).toBeVisible();

  const questions = page.locator("fieldset");
  const questionCount = await questions.count();
  if (questionCount === 0) test.skip(true, "The selected quiz has no questions.");

  for (let index = 0; index < questionCount; index += 1) {
    await questions.nth(index).locator('input[type="radio"]').first().check();
  }

  await page.getByRole("button", { name: "Submit Quiz" }).click();
  await expect(page.getByText(/Previous score:|Quiz submitted/i).first()).toBeVisible();
});
