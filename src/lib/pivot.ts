import { z } from "zod";

export const entrySchema = z.object({ id: z.string(), title: z.string().max(200), text: z.string().min(1).max(30000) });
export type Entry = z.infer<typeof entrySchema>;
export const evidenceSchema = z.object({ sourceId: z.string(), quote: z.string(), reasoning: z.string(), status: z.enum(["Supported", "Needs context", "Not established"]), question: z.string() });
export const capabilitySchema = z.object({ id: z.string(), name: z.string(), description: z.string(), evidence: evidenceSchema });
export const skillTranslationSchema = z.object({ term: z.string(), capability: z.string(), interview: z.string(), evidence: evidenceSchema });
export const pathwaySchema = z.object({ id: z.string(), title: z.string(), category: z.enum(["Established", "Hybrid", "Emerging"]), description: z.string(), skills: z.array(skillTranslationSchema), interview: z.string(), nextStep: z.string() });
export const analysisSchema = z.object({ capabilities: z.array(capabilitySchema).max(12), pathways: z.array(pathwaySchema).max(5) });
export type Analysis = z.infer<typeof analysisSchema>;
export type Capability = z.infer<typeof capabilitySchema>;
export type Pathway = z.infer<typeof pathwaySchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type SkillTranslation = z.infer<typeof skillTranslationSchema>;

export const pivotModeSchema = z.enum(["title", "description", "options"]);
export type PivotMode = z.infer<typeof pivotModeSchema>;
export const analysisInputSchema = z.object({ entries: z.array(entrySchema).min(1).max(20), selected: z.array(z.string().min(1)).max(12), direction: z.string().max(1000), jobDescription: z.string().max(15000), mode: pivotModeSchema, stage: z.enum(["discover", "bridge"]) }).superRefine((data, ctx) => {
  if (data.stage !== "bridge") return;
  if (!data.selected.length) ctx.addIssue({ code: "custom", message: "Select at least one skill.", path: ["selected"] });
  if (data.mode === "title" && !data.direction.trim()) ctx.addIssue({ code: "custom", message: "Enter a job title.", path: ["direction"] });
  if (data.mode === "description" && !data.jobDescription.trim()) ctx.addIssue({ code: "custom", message: "Enter a job description.", path: ["jobDescription"] });
});
export function initialSkillSelection(): string[] { return []; }
export function canDiscoverBridge(selected: string[], mode: PivotMode, direction: string, jobDescription: string) {
  return selected.length > 0 && (mode === "options" || (mode === "title" ? !!direction.trim() : !!jobDescription.trim()));
}
export const jobSearchConnected = false;
export function validateSelectedBridge(analysis: Analysis, selected: string[]): Analysis {
  const pathway = analysis.pathways[0];
  if (!pathway || selected.some((name) => pathway.skills.filter((skill) => skill.capability === name).length !== 1)) throw new Error("Incomplete selected-skill translation");
  return { ...analysis, pathways: [{ ...pathway, skills: selected.flatMap((name) => pathway.skills.filter((skill) => skill.capability === name)) }] };
}

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

export function removeCapability(analysis: Analysis, id: string): Analysis {
  return { ...analysis, capabilities: analysis.capabilities.filter((capability) => capability.id !== id) };
}

export function reviseCapability(analysis: Analysis, id: string, patch: { name?: string; description?: string }): Analysis {
  return { ...analysis, capabilities: analysis.capabilities.map((capability) => capability.id === id ? { ...capability, ...patch } : capability) };
}

export function renameSelected(selected: string[], from: string, to: string): string[] {
  return selected.map((name) => (name === from ? to : name));
}

export function withInterview(analysis: Analysis, capability: string, interview: string): Analysis {
  return { ...analysis, pathways: analysis.pathways.map((pathway) => ({ ...pathway, skills: pathway.skills.map((skill) => skill.capability === capability ? { ...skill, interview } : skill) })) };
}

export const CLARIFICATIONS_ID = "user-clarifications";
export const CONTEXT_PREFIX = "Context you added: ";

export function appendContext(entries: Entry[], sourceId: string, answer: string): Entry[] {
  const text = answer.trim();
  if (!text) return entries;
  const addition = `\n\n${CONTEXT_PREFIX}${text}`;
  const source = entries.find((entry) => entry.id === sourceId);
  if (source) return entries.map((entry) => (entry.id === sourceId ? { ...entry, text: entry.text + addition } : entry));
  const clarifications = entries.find((entry) => entry.id === CLARIFICATIONS_ID);
  if (clarifications) return entries.map((entry) => (entry.id === CLARIFICATIONS_ID ? { ...entry, text: entry.text + addition } : entry));
  return [...entries, { id: CLARIFICATIONS_ID, title: "Your clarifications", text: `${CONTEXT_PREFIX}${text}` }];
}
