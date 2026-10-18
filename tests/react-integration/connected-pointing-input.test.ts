import assert from "node:assert/strict";
import { test } from "node:test";
import {
  connectedContactRegion,
  connectedContactRegions,
} from "../../apps/web/src/platform/connected-pointing-input.ts";

for (const pixelsPerUnit of [0.6, 0.768, 0.8, 1]) {
  test(`actual ${pixelsPerUnit} CSS scale gives 44-pixel nonoverlapping contact regions at source centers`, () => {
    const regions = connectedContactRegions({ pixelsPerUnit });
    for (const circle of regions) {
      assert.equal(circle.radius * pixelsPerUnit >= 22, true);
      const nearEdge = {
        x: circle.x + 21.9 / pixelsPerUnit,
        y: circle.y,
        pixelsPerUnit,
      };
      assert.equal(connectedContactRegion(nearEdge), circle.kind);
      assert.equal(
        connectedContactRegion({
          ...nearEdge,
          x: circle.x + 22.1 / pixelsPerUnit,
        }),
        null,
      );
      for (const other of regions)
        if (other.kind !== circle.kind)
          assert.equal(
            Math.hypot(circle.x - other.x, circle.y - other.y) >
              circle.radius + other.radius,
            true,
          );
    }
    assert.equal(
      connectedContactRegion({ x: 365, y: 275, pixelsPerUnit }),
      null,
    );
  });
}
test("unmeasured or invalid transforms cannot claim a contact", () => {
  for (const pixelsPerUnit of [0, -1, Infinity, NaN])
    assert.equal(
      connectedContactRegion({ x: 50, y: 240, pixelsPerUnit }),
      null,
    );
});
