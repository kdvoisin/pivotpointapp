import { describe, expect, it } from "vitest";
import { appendContext, CLARIFICATIONS_ID, pathwaySchema, removeCapability, renameSelected, reviseCapability, withInterview, type Analysis } from "@/lib/pivot";

const evidence = { sourceId: "one", quote: "I wrote a training guide", reasoning: "Creates learning materials.", status: "Supported" as const, question: "" };
const analysis: Analysis = {
  capabilities: [
    { id: "c1", name: "Documentation", description: "Writing guides others follow.", evidence },
    { id: "c2", name: "Coaching", description: "Answering new team members’ questions.", evidence },
  ],
  pathways: [{ id: "p", title: "Trainer", category: "Established", description: "", interview: "", nextStep: "", skills: [
    { term: "Learning materials", capability: "Documentation", interview: "I wrote the guide new hires learned from.", evidence },
    { term: "Onboarding support", capability: "Coaching", interview: "I answered questions for new team members.", evidence },
  ] }],
};
const entries = [{ id: "one", title: "My work", text: "I wrote a training guide and answered new team members’ questions." }];

describe("Skills repository corrections", () => {
  it("removes only the deleted skill", () => {
    expect(removeCapability(analysis, "c1").capabilities.map((c) => c.name)).toEqual(["Coaching"]);
    expect(removeCapability(analysis, "c1").pathways[0]?.skills).toHaveLength(2);
  });
  it("renames a skill and carries the selection to the new name", () => {
    expect(reviseCapability(analysis, "c1", { name: "Technical writing" }).capabilities[0]?.name).toBe("Technical writing");
    expect(reviseCapability(analysis, "c1", { description: "Guides for new hires." }).capabilities[0]?.description).toBe("Guides for new hires.");
    expect(renameSelected(["Documentation", "Coaching"], "Documentation", "Technical writing")).toEqual(["Technical writing", "Coaching"]);
  });
  it("appends an answered follow-up question to the cited source without rewriting it", () => {
    const next = appendContext(entries, "one", "I delivered the session to 12 people.");
    expect(next).toHaveLength(1);
    expect(next[0]?.text).toBe("I wrote a training guide and answered new team members’ questions.\n\nContext you added: I delivered the session to 12 people.");
    expect(appendContext(entries, "one", "   ")).toEqual(entries);
  });
  it("keeps an answer when the cited source is gone", () => {
    const next = appendContext(entries, "missing", "I ran the training monthly.");
    expect(next).toHaveLength(2);
    expect(next[1]).toEqual({ id: CLARIFICATIONS_ID, title: "Your clarifications", text: "Context you added: I ran the training monthly." });
  });
  it("edits only the requested interview answer", () => {
    const next = withInterview(analysis, "Documentation", "I built the onboarding guide.");
    expect(next.pathways[0]?.skills[0]?.interview).toBe("I built the onboarding guide.");
    expect(next.pathways[0]?.skills[1]?.interview).toBe("I answered questions for new team members.");
  });
  it("requires an interview answer for every translated skill", () => {
    const { interview: _interview, ...withoutInterview } = analysis.pathways[0]!.skills[0]!;
    expect(pathwaySchema.safeParse({ ...analysis.pathways[0]!, skills: [withoutInterview] }).success).toBe(false);
  });
});
