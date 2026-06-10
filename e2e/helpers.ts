import { expect, type Page } from "@playwright/test";

export type TestRole = "student" | "teacher" | "admin";

export function credentialsFor(role: TestRole) {
  const prefix = `E2E_${role.toUpperCase()}`;
  return {
    email: process.env[`${prefix}_EMAIL`],
    password: process.env[`${prefix}_PASSWORD`],
  };
}

export async function loginAs(page: Page, role: TestRole) {
  const credentials = credentialsFor(role);
  if (!credentials.email || !credentials.password) return false;

  await page.goto("/login");
  await page.locator("#email").fill(credentials.email);
  await page.locator("#password").fill(credentials.password);
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  return true;
}
