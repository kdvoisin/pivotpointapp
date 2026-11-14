import { describe, expect, it } from "vitest";
import { groundAnalysis, validateEvidence, type Evidence } from "@/lib/pivot";

const entries = [{ id: "one", title: "My work", text: "I wrote a training guide and answered new team members’ questions." }];
const evidence: Evidence = { sourceId: "one", quote: "I wrote a training guide", reasoning: "Creating a guide supports documentation.", status: "Supported", question: "" };
describe("Honest evidence labels", () => {
  it("keeps Supported for an exact source passage without implying external verification", () => { expect(validateEvidence(evidence, entries).status).toBe("Supported"); });
  it("does not mark invented outcomes as Supported", () => { expect(validateEvidence({ ...evidence, quote: "I increased revenue by 40%" }, entries).status).toBe("Not established"); });
  it("does not support a connection without its source", () => { expect(validateEvidence({ ...evidence, sourceId: "missing" }, entries).status).toBe("Not established"); });
  it("keeps Needs context distinct from supported claims", () => { expect(validateEvidence({ ...evidence, status: "Needs context", question: "Did you deliver the training?" }, entries).status).toBe("Needs context"); });
  it("clears supported evidence after source correction", () => { const corrected = [{ id: "one", title: "My work", text: "I answered questions but did not write the guide." }]; expect(validateEvidence(evidence, corrected).status).toBe("Not established"); });
  it("validates capability and pathway sibling evidence equally", () => { const invalid = { ...evidence, quote: "I managed the entire team" }; const output = groundAnalysis({ capabilities: [{ id: "c", name: "Leadership", description: "", evidence: invalid }], pathways: [{ id: "p", title: "Operations", category: "Established", description: "", interview: "", nextStep: "", skills: [{ term: "Leadership", capability: "Leadership", evidence: invalid }] }] }, entries); expect(output.capabilities[0]?.evidence.status).toBe("Not established"); expect(output.pathways[0]?.skills[0]?.evidence.status).toBe("Not established"); });
});