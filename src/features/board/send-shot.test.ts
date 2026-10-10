import { describe, expect, it } from "vitest";

import { courtyardBoardFixture } from "./mocks";
import { storyboardDetailsFixture } from "@/features/storyboards/mocks";
import { placeShots } from "@/features/storyboards/timeline";

import { sendShotToBoard, sentNodeId, syncTimelineNodes, TIMELINE_GROUP_ID } from "./send-shot";
import { type SendShotRequest } from "./schema";

const input: SendShotRequest = {
  shotId: "sh_9",
  label: "Shot 9",
  art: "dusk",
  state: "ready",
  durationSec: 4,
};

describe("sendShotToBoard", () => {
  it("adds a linked video node in a timeline group", () => {
    const { board } = sendShotToBoard(courtyardBoardFixture, input);
    const node = board.nodes.find((candidate) => candidate.id === sentNodeId("sh_9"));
    expect(node).toMatchObject({ kind: "video", usedInTimeline: true, groupId: TIMELINE_GROUP_ID });
    expect(board.groups.filter((group) => group.id === TIMELINE_GROUP_ID)).toHaveLength(1);
  });

  it("does nothing the second time", () => {
    const once = sendShotToBoard(courtyardBoardFixture, input).board;
    const twice = sendShotToBoard(once, input);
    expect(twice.board.nodes).toHaveLength(once.nodes.length);
    expect(twice.message).toMatch(/already/);
  });
});

describe("syncTimelineNodes", () => {
  it("shows the take the timeline has selected now", () => {
    const detail = storyboardDetailsFixture.find((item) => item.id === "sb_courtyard");
    const placed = detail ? placeShots(detail) : [];
    const withTakes = placed.find((item) => item.shot.takes.length >= 2);
    if (!detail || !withTakes) throw new Error("Expected a shot with two takes");
    const { shot } = withTakes;
    const sent = sendShotToBoard(courtyardBoardFixture, {
      shotId: shot.id,
      label: "Shot",
      art: "rain",
      state: "ready",
      durationSec: shot.durationSec,
    }).board;
    const synced = syncTimelineNodes(sent, detail);
    const node = synced.nodes.find((candidate) => candidate.id === sentNodeId(shot.id));
    const expected = shot.takes.find((take) => take.id === shot.selectedTakeId)?.art;
    expect(node?.kind === "video" ? node.art : null).toBe(expected);
  });
});
