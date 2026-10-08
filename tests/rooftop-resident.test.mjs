import test from "node:test";
import assert from "node:assert/strict";
import { makeResident, ERRANDS } from "../rooftop/resident.mjs";
test("a wet arrival starts at home and never invents a storm-time cycling errand", () => {
  for (const condition of ["rain", "heavy", "thunderstorm", "typhoon"]) {
    const resident = makeResident(() => 0.99, {
      environment: () => ({ condition, rain: 1 }),
    });
    assert.equal(resident.present, true);
    assert.equal(resident.status, "");
    resident.update(500, { condition, rain: 1 });
    assert.equal(resident.present, true);
  }
});
test("Dongdong has no status at home, announces an errand only while away, and returns automatically", () => {
  const resident = makeResident(() => 0);
  assert.equal(resident.present, true);
  assert.equal(resident.status, "");
  assert.equal(resident.update(119), false);
  assert.equal(resident.update(2), true);
  assert.equal(resident.present, false);
  assert.ok(ERRANDS.includes(resident.status));
  assert.equal(resident.update(46), true);
  assert.equal(resident.present, true);
  assert.equal(resident.status, "");
});
test("a randomly absent initial resident always has a finite errand and a return time", () => {
  const resident = makeResident(() => 0.99);
  assert.equal(resident.present, false);
  assert.ok(ERRANDS.includes(resident.status));
  assert.ok(resident.remaining > 0 && resident.remaining <= 120);
  assert.equal(resident.update(resident.remaining + 0.1), true);
  assert.equal(resident.present, true);
  assert.equal(resident.status, "");
});

test("market errands only happen at dawn and activity pools follow period changes", async () => {
  const { ERRAND_POOLS } = await import("../rooftop/resident.mjs");
  for (const [phase, pool] of Object.entries(ERRAND_POOLS))
    assert.equal(
      pool.some((x) => x.includes("菜市场")),
      phase === "dawn",
    );
  let phase = "dawn";
  const resident = makeResident(() => 0.99, { phase: () => phase });
  phase = "late";
  resident.update(1);
  assert.ok(ERRAND_POOLS.late.includes(resident.status));
});
