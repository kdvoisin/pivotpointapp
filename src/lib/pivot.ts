import { z } from "zod";

export const entrySchema = z.object({ id: z.string(), title: z.string().max(200), text: z.string().min(1).max(30000) });
export type Entry = z.infer<typeof entrySchema>;
export const evidenceSchema = z.object({ sourceId: z.string(), quote: z.string(), reasoning: z.string(), status: z.enum(["Supported", "Needs context", "Not established"]), question: z.string() });
export const capabilitySchema = z.object({ id: z.string(), name: z.string(), description: z.string(), evidence: evidenceSchema });
export const pathwaySchema = z.object({ id: z.string(), title: z.string(), category: z.enum(["Established", "Hybrid", "Emerging"]), description: z.string(), skills: z.array(z.object({ term: z.string(), capability: z.string(), evidence: evidenceSchema })), interview: z.string(), nextStep: z.string() });
export const analysisSchema = z.object({ capabilities: z.array(capabilitySchema).max(12), pathways: z.array(pathwaySchema).max(5) });
export type Analysis = z.infer<typeof analysisSchema>;
export type Pathway = z.infer<typeof pathwaySchema>;
export type Evidence = z.infer<typeof evidenceSchema>;

export function validateEvidence(evidence: Evidence, entries: Entry[]): Evidence {
  const source = entries.find((entry) => entry.id === evidence.sourceId);
  if (evidence.status === "Supported" && (!evidence.quote.trim() || !source?.text.includes(evidence.quote))) {
    return { ...evidence, status: "Not established", quote: "", reasoning: "A matching source passage was not found in the submitted materials.", question: evidence.question || "What experience could support this connection?" };
  }
  return evidence;
}

export function groundAnalysis(analysis: Analysis, entries: Entry[]): Analysis {
  return {
    capabilities: analysis.capabilities.map((capability) => ({ ...capability, evidence: validateEvidence(capability.evidence, entries) })),
    pathways: analysis.pathways.map((pathway) => ({ ...pathway, skills: pathway.skills.map((skill) => ({ ...skill, evidence: validateEvidence(skill.evidence, entries) })) })),
  };
}