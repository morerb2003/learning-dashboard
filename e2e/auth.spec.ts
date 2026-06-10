import { expect, test } from "@playwright/test";
import { credentialsFor, loginAs } from "./helpers";

test.describe("authentication", () => {
  test("protected routes redirect anonymous users to login", async ({ page }) => {
    await page.goto("/learning");
    await expect(page).toHaveURL(/\/login\?next=%2Flearning|\/login\?next=\/learning/);
    await expect(
      page.getByRole("heading", { name: "Continue your learning" })
    ).toBeVisible();
  });

  test("invalid password shows an authentication error", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill("not-a-user@example.com");
    await page.locator("#password").fill("definitely-not-valid");
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("student can sign in and reach the dashboard", async ({ page }) => {
    test.skip(
      !credentialsFor("student").email || !credentialsFor("student").password,
      "Set E2E_STUDENT_EMAIL and E2E_STUDENT_PASSWORD."
    );

    await loginAs(page, "student");
    await expect(page.getByText(/Welcome back,/i).first()).toBeVisible();
  });

  test("teacher account can access the teacher workspace", async ({ page }) => {
    test.skip(
      !credentialsFor("teacher").email || !credentialsFor("teacher").password,
      "Set E2E_TEACHER_EMAIL and E2E_TEACHER_PASSWORD."
    );

    await loginAs(page, "teacher");
    await page.goto("/teacher");
    await expect(page.getByRole("heading", { name: "Teacher Dashboard" })).toBeVisible();
  });
});
