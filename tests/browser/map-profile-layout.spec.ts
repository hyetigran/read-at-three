import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 900, height: 600 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
]) {
  for (const displayName of ["", "Alexandria".repeat(12)]) {
    test(`map profile controls clear all six lessons at ${viewport.width}×${viewport.height} with ${displayName ? "a long" : "the default"} name`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await expect(
        page.getByRole("heading", {
          name: "A moment for the grown-up",
          exact: true,
        }),
      ).toBeVisible();
      await page.getByLabel("Type the word", { exact: true }).fill("meadow");
      await page
        .getByRole("button", { name: "Continue setup", exact: true })
        .click();
      await page
        .getByRole("button", {
          name: "I have read this preparation",
          exact: true,
        })
        .click();
      await expect(
        page.getByRole("group", { name: "Choose your animal", exact: true }),
      ).toBeVisible();
      if (displayName)
        await page
          .getByLabel("Name (optional)", { exact: true })
          .fill(displayName);
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await expect(page.locator(".course-map")).toBeVisible();
      await page.reload();
      await expect(page.locator(".course-map")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Choose child profile", exact: true }),
      ).toContainText(displayName || "Your child");
      await expect(page.locator(".course-pedestal")).toHaveCount(6);
      await expect(page.locator(".course-map-header a")).toHaveCount(1);
      await expect(page.locator(".course-map-header button")).toHaveCount(1);
      const geometry = await page.evaluate(() => {
        const pedestals = [...document.querySelectorAll(".course-pedestal")];
        const controls = [
          ...document.querySelectorAll(
            ".course-map-header a,.course-map-header button,.course-map-bottom a,.course-map-bottom button",
          ),
        ];
        const collisions = pedestals.flatMap((pedestal) =>
          controls.flatMap((control) => {
            const lessonBounds = pedestal.getBoundingClientRect();
            const controlBounds = control.getBoundingClientRect();
            return Math.min(lessonBounds.right, controlBounds.right) >
              Math.max(lessonBounds.left, controlBounds.left) &&
              Math.min(lessonBounds.bottom, controlBounds.bottom) >
                Math.max(lessonBounds.top, controlBounds.top)
              ? [
                  {
                    lesson: pedestal.getAttribute("data-lesson-number"),
                    control: control.getAttribute("aria-label"),
                    lessonBounds: lessonBounds.toJSON(),
                    controlBounds: controlBounds.toJSON(),
                  },
                ]
              : [];
          }),
        );
        const clipped = [...pedestals, ...controls].flatMap((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.left < 0 ||
            bounds.top < 0 ||
            bounds.right > innerWidth ||
            bounds.bottom > innerHeight
            ? [{ element: element.outerHTML, bounds: bounds.toJSON() }]
            : [];
        });
        const numberHits = pedestals.map((pedestal) => {
          const number = pedestal.querySelector(
            ".course-pedestal-top > [data-origin]",
          );
          if (!number) throw new Error("A lesson number is missing.");
          const bounds = number.getBoundingClientRect();
          return (
            document
              .elementFromPoint(
                bounds.x + bounds.width / 2,
                bounds.y + bounds.height / 2,
              )
              ?.closest(".course-pedestal") === pedestal
          );
        });
        return {
          viewport: { width: innerWidth, height: innerHeight },
          collisions,
          clipped,
          numberHits,
          pedestals: pedestals.map((pedestal) => ({
            lesson: pedestal.getAttribute("data-lesson-number"),
            bounds: pedestal.getBoundingClientRect().toJSON(),
          })),
          controls: controls.map((control) => ({
            label: control.getAttribute("aria-label") || control.textContent,
            bounds: control.getBoundingClientRect().toJSON(),
          })),
        };
      });
      await testInfo.attach("map-geometry", {
        body: JSON.stringify(geometry, null, 2),
        contentType: "application/json",
      });
      await testInfo.attach("map", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
      expect(geometry.collisions).toEqual([]);
      expect(geometry.clipped).toEqual([]);
      expect(geometry.numberHits).toEqual([true, true, true, true, true, true]);
      for (const number of [1, 2, 3, 4, 5, 6]) {
        await page
          .getByRole("link", { name: `Lesson ${number}`, exact: true })
          .locator(".course-pedestal-top > [data-origin]")
          .click();
        await expect(page.locator(".course-header h1")).toContainText(
          `Synthetic lesson ${number}`,
        );
        await page
          .getByRole("link", { name: "Back to lesson map", exact: true })
          .click();
        await expect(page.locator(".course-map")).toBeVisible();
      }
    });
  }
}
