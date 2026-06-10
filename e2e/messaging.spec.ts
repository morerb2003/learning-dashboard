import { expect, test } from "@playwright/test";
import { credentialsFor, loginAs } from "./helpers";

test("student can send a direct message to an available course contact", async ({ page }) => {
  test.skip(
    !credentialsFor("student").email || !credentialsFor("student").password,
    "Set student E2E credentials and ensure the account has a teacher or admin contact."
  );

  await loginAs(page, "student");
  await page.goto("/community");
  await expect(page.getByRole("heading", { name: "Communication Center" })).toBeVisible();
  await page.getByRole("button", { name: "Messages" }).click();

  const contact = page.locator("aside button").first();
  if ((await contact.count()) === 0) {
    test.skip(true, "No valid communication contact is available.");
  }
  await contact.click();

  const message = `Playwright message ${Date.now()}`;
  await page.getByPlaceholder("Write a message...").fill(message);
  await page.getByPlaceholder("Write a message...").press("Enter");
  await expect(page.getByText(message)).toBeVisible();
});
