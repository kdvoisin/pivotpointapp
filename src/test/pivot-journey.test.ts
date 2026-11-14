import { describe, expect, it } from "vitest";
import { analysisInputSchema, canDiscoverBridge, initialSkillSelection, jobSearchConnected, validateSelectedBridge, type Analysis } from "@/lib/pivot";
const input = { entries: [{ id: "one", title: "Experience", text: "I wrote a training guide." }], selected: ["Documentation"], direction: "Trainer", jobDescription: "", mode: "title", stage: "bridge" };
describe("Three-step journey rules", () => {
  it("starts every discovered skill unselected", () => expect(initialSkillSelection()).toEqual([]));
  it("requires at least one selected skill before continuing", () => { expect(canDiscoverBridge([], "options", "", "")).toBe(false); expect(analysisInputSchema.safeParse({ ...input, selected: [] }).success).toBe(false); });
  it("requires the job title in title mode", () => { expect(canDiscoverBridge(["Documentation"], "title", "", "")).toBe(false); expect(analysisInputSchema.safeParse({ ...input, direction: " " }).success).toBe(false); });
  it("requires the job description in description mode", () => { expect(canDiscoverBridge(["Documentation"], "description", "Trainer", "")).toBe(false); expect(analysisInputSchema.safeParse({ ...input, mode: "description" }).success).toBe(false); });
  it("allows Explore my options without target text", () => expect(canDiscoverBridge(["Documentation"], "options", "", "")).toBe(true));
  it("reports real job search as disconnected without a source", () => expect(jobSearchConnected).toBe(false));
  it("requires a translation for every selected skill", () => { const analysis: Analysis = { capabilities: [], pathways: [{ id: "p", title: "Trainer", category: "Established", description: "", interview: "", nextStep: "", skills: [{ capability: "Documentation", term: "Learning materials", evidence: { sourceId: "one", quote: "I wrote a training guide.", reasoning: "Creates learning materials.", status: "Supported", question: "" } }] }] }; expect(() => validateSelectedBridge(analysis, ["Documentation", "Coaching"])).toThrow(); expect(validateSelectedBridge(analysis, ["Documentation"]).pathways[0]?.skills.map((skill) => skill.capability)).toEqual(["Documentation"]); });
});
