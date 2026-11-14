import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeExperience } from "@/lib/analysis.functions";
import { canDiscoverBridge, initialSkillSelection, type Analysis, type Entry, type PivotMode } from "@/lib/pivot";

function useSession() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [direction, setDirection] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [mode, setModeState] = useState<PivotMode>("options");
  const [experienceText, setExperienceText] = useState("");
  const [bridge, setBridge] = useState<Analysis | null>(null);
  const [bridgeReady, setBridgeReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const generation = useRef(0);
  const analyze = useServerFn(analyzeExperience);
  const changeEntries = (next: Entry[]) => {
    generation.current += 1; setEntries(next); setAnalysis(null); setBridge(null); setBridgeReady(false); setSelected([]); setError(""); setBusy(false);
  };
  const invalidateBridge = () => { generation.current += 1; setBridge(null); setBridgeReady(false); setBusy(false); setError(""); };
  const changeSelected = (next: string[]) => { invalidateBridge(); setSelected(next); };
  const changeDirection = (next: string) => { invalidateBridge(); setDirection(next); };
  const changeJobDescription = (next: string) => { invalidateBridge(); setJobDescription(next); };
  const setMode = (next: PivotMode) => { invalidateBridge(); setModeState(next); };
  const run = async (remix = false, inputEntries = entries) => {
    if (!consent || !inputEntries.length) return false;
    if (remix && !canDiscoverBridge(selected, mode, direction, jobDescription)) return false;
    if (remix && mode === "options") { setBridge(null); setBridgeReady(true); setError(""); return true; }
    const current = ++generation.current;
    setBusy(true); setError("");
    try {
      const result = await analyze({ data: { entries: inputEntries, selected: remix ? selected : [], direction: remix && mode === "title" ? direction : "", jobDescription: remix && mode === "description" ? jobDescription : "", mode, stage: remix ? "bridge" : "discover" } });
      if (generation.current !== current) return false;
      if (result.error || !result.analysis) { setError(result.error || "Analysis unavailable."); return false; }
      if (remix) { setBridge(result.analysis); setBridgeReady(true); }
      else { setAnalysis(result.analysis); setSelected(initialSkillSelection()); setBridge(null); setBridgeReady(false); }
      return true;
    } catch { if (generation.current === current) setError("We couldn’t connect. Your materials are still here; please try again."); return false; }
    finally { if (generation.current === current) setBusy(false); }
  };
  const clear = () => { changeEntries([]); setDirection(""); setJobDescription(""); setExperienceText(""); setModeState("options"); setConsent(false); };
  return { entries, changeEntries, analysis, bridge, bridgeReady, selected, setSelected: changeSelected, direction, setDirection: changeDirection, jobDescription, setJobDescription: changeJobDescription, mode, setMode, experienceText, setExperienceText, busy, error, consent, setConsent, run, clear };
}
type Session = ReturnType<typeof useSession>;
const PivotContext = createContext<Session | null>(null);
export function PivotProvider({ children }: { children: ReactNode }) { const session = useSession(); return <PivotContext.Provider value={session}>{children}</PivotContext.Provider>; }
export function usePivot() { const session = useContext(PivotContext); if (!session) throw new Error("PivotPoint session missing"); return session; }