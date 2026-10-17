import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export async function reloadSavedTurn({
  page,
  turnId,
}: {
  page: Page;
  turnId: string;
}) {
  const saved = page.locator("main[data-turn-id]");
  await expect(saved).toHaveAttribute("data-turn-id", turnId);
  const checkpoint = await saved.getAttribute("data-checkpoint-id");
  if (checkpoint === null) throw new Error("Saved teaching checkpoint missing");
  await page.reload();
  const paused = page.getByRole("heading", {
    name: "Reading is paused",
    exact: true,
  });
  await expect(
    page.locator(`main[data-turn-id="${turnId}"]`).or(paused),
  ).toBeVisible();
  if (await paused.isVisible())
    await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(saved).toHaveAttribute("data-turn-id", turnId);
  await expect(saved).toHaveAttribute("data-checkpoint-id", checkpoint);
}
