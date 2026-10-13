import { describe, expect, it } from "vitest";

import { tourScenario } from "./choices";
import { nextStep, previousStep } from "./steps";

describe("example steps", () => {
  it("walks the three steps in order", () => {
    expect(nextStep("1")).toBe("2");
    expect(nextStep("3")).toBeNull();
    expect(previousStep("1")).toBeNull();
    expect(previousStep("3")).toBe("2");
  });
});

describe("tourScenario", () => {
  it("prefers the example the API marks as the tour", () => {
    const scenarios = [
      { id: "a", isTour: false },
      { id: "b", isTour: true },
    ];
    expect(tourScenario(scenarios)?.id).toBe("b");
  });

  it("falls back to the first example, or none", () => {
    expect(tourScenario([{ id: "a", isTour: false }])?.id).toBe("a");
    expect(tourScenario([])).toBeNull();
  });
});
