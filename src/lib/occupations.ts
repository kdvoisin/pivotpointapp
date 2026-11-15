import { z } from "zod";

export const ONET_SOURCE = "O*NET 31.0 Database by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA), used under the CC BY 4.0 license.";
export const onetLink = (code: string) => `https://www.onetonline.org/link/summary/${encodeURIComponent(code)}`;

export const occupationQuerySchema = z.object({
  capabilities: z.array(z.object({ name: z.string().min(1).max(200), description: z.string().max(1000), quote: z.string().max(2000) })).min(1).max(12),
  focus: z.string().max(1000),
  offset: z.number().int().min(0).max(400),
});
export type OccupationQuery = z.infer<typeof occupationQuerySchema>;

export type Candidate = { code: string; title: string; description: string; tasks: string[]; skills: string[]; activities: string[] };
export const rankedSchema = z.object({ matches: z.array(z.object({ code: z.string(), title: z.string(), strength: z.enum(["Strong", "Partial"]), connections: z.array(z.object({ capability: z.string(), responsibility: z.string(), why: z.string() })), gaps: z.string() })) });
export type Ranked = z.infer<typeof rankedSchema>["matches"][number];
export type OccupationMatch = Ranked & { description: string; link: string };

/** Keeps only AI-ranked items whose code + exact title come from the retrieved database records, whose responsibilities are exact O*NET text for that record, and whose capabilities were selected. */
export function validateMatches(ranked: Ranked[], candidates: Candidate[], selected: string[]): OccupationMatch[] {
  const seen = new Set<string>();
  return ranked.flatMap((item) => {
    const record = candidates.find((candidate) => candidate.code === item.code);
    if (!record || record.title !== item.title || seen.has(item.code)) return [];
    const allowed = [...record.tasks, ...record.skills, ...record.activities, record.description];
    const connections = item.connections.filter((c) => selected.includes(c.capability) && allowed.includes(c.responsibility));
    if (!connections.length) return [];
    seen.add(item.code);
    return [{ ...item, connections, description: record.description, link: onetLink(record.code) }];
  });
}
