import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeExperience } from "@/lib/analysis.functions";
import type { Analysis, Entry } from "@/lib/pivot";

function useSession() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [direction, setDirection] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const generation = useRef(0);
  const analyze = useServerFn(analyzeExperience);
  const changeEntries = (next: Entry[]) => {
    generation.current += 1; setEntries(next); setAnalysis(null); setSelected([]); setError(""); setBusy(false);
  };
  const run = async (remix = false) => {
    if (!consent || !entries.length) return false;
    const current = ++generation.current;
    setBusy(true); setError("");
    try {
      const result = await analyze({ data: { entries, selected: remix ? selected : [], direction: remix ? direction : "", jobDescription: remix ? jobDescription : "" } });
      if (generation.current !== current) return false;
      if (result.error || !result.analysis) { setError(result.error || "Analysis unavailable."); return false; }
      setAnalysis(result.analysis);
      if (!remix) setSelected(result.analysis.capabilities.filter((c) => c.evidence.status !== "Not established").map((c) => c.name));
      return true;
    } catch { if (generation.current === current) setError("We couldn’t connect. Your materials are still here; please try again."); return false; }
    finally { if (generation.current === current) setBusy(false); }
  };
  const clear = () => { changeEntries([]); setDirection(""); setJobDescription(""); setConsent(false); };
  return { entries, changeEntries, analysis, selected, setSelected, direction, setDirection, jobDescription, setJobDescription, busy, error, consent, setConsent, run, clear };
}
type Session = ReturnType<typeof useSession>;
const PivotContext = createContext<Session | null>(null);
export function PivotProvider({ children }: { children: ReactNode }) { const session = useSession(); return <PivotContext.Provider value={session}>{children}</PivotContext.Provider>; }
export function usePivot() { const session = useContext(PivotContext); if (!session) throw new Error("PivotPoint session missing"); return session; }