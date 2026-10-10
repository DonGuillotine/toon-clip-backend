import { describe, expect, it } from "vitest";

import { useFrameHandoff } from "./frame-handoff";

describe("useFrameHandoff", () => {
  it("holds frames and a prompt until Quick create clears it", () => {
    const store = useFrameHandoff.getState();
    store.give("first", { name: "Shot 2", url: "/api/frames?art=dusk&label=Shot+2" });
    store.givePrompt("Kaito leaps the wall");
    expect(useFrameHandoff.getState().pending).toMatchObject({
      first: { name: "Shot 2" },
      last: null,
      prompt: "Kaito leaps the wall",
    });
    useFrameHandoff.getState().clear();
    expect(useFrameHandoff.getState().pending).toEqual({ first: null, last: null, prompt: null });
  });
});
