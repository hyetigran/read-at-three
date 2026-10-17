import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export async function reloadSavedTurn({
  page,
  turnId,
}: {
  page: Page;
  turnId: string;
}): Promise<{ kind: "recoveredActive" } | { kind: "resumedPaused" }> {
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
  const resumed = await paused.isVisible();
  if (resumed)
    await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(saved).toHaveAttribute("data-turn-id", turnId);
  await expect(saved).toHaveAttribute("data-checkpoint-id", checkpoint);
  return resumed ? { kind: "resumedPaused" } : { kind: "recoveredActive" };
}
