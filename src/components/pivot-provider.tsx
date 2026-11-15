import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeExperience } from "@/lib/analysis.functions";
import { appendContext, canDiscoverBridge, groundAnalysis, initialSkillSelection, removeCapability, renameSelected, reviseCapability, withInterview, type Analysis, type Entry, type PivotMode } from "@/lib/pivot";

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
  const [contextAnswers, setContextAnswers] = useState<Record<string, string>>({});
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
  const reviseEntryText = (id: string, text: string) => {
    const next = entries.map((entry) => (entry.id === id ? { ...entry, text } : entry));
    generation.current += 1;
    setEntries(next);
    if (id === "typed-experience") setExperienceText(text);
    if (analysis) setAnalysis(groundAnalysis(analysis, next));
    setBridge(null); setBridgeReady(false); setBusy(false); setError("");
  };
  const addContext = (capability: string, sourceId: string, answer: string) => {
    const text = answer.trim();
    if (!text) return;
    const next = appendContext(entries, sourceId, text);
    generation.current += 1;
    setEntries(next);
    if (analysis) setAnalysis(groundAnalysis(analysis, next));
    if (bridge) setBridge(groundAnalysis(bridge, next));
    setContextAnswers((previous) => ({ ...previous, [capability]: text }));
    setError("");
  };
  const reviseCapabilityEntry = (id: string, patch: { name?: string; description?: string }) => {
    if (!analysis) return;
    const before = analysis.capabilities.find((capability) => capability.id === id);
    invalidateBridge();
    setAnalysis(reviseCapability(analysis, id, patch));
    if (before && patch.name !== undefined && patch.name !== before.name) {
      const from = before.name; const to = patch.name;
      setSelected((names) => renameSelected(names, from, to));
    }
  };
  const removeCapabilityEntry = (id: string) => {
    if (!analysis) return;
    const removed = analysis.capabilities.find((capability) => capability.id === id);
    invalidateBridge();
    setAnalysis(removeCapability(analysis, id));
    if (removed) setSelected((names) => names.filter((name) => name !== removed.name));
  };
  const setInterview = (capability: string, interview: string) => { if (bridge) setBridge(withInterview(bridge, capability, interview)); };
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
  const clear = () => { changeEntries([]); setDirection(""); setJobDescription(""); setExperienceText(""); setModeState("options"); setConsent(false); setContextAnswers({}); };
  return { entries, changeEntries, analysis, bridge, bridgeReady, selected, setSelected: changeSelected, direction, setDirection: changeDirection, jobDescription, setJobDescription: changeJobDescription, mode, setMode, experienceText, setExperienceText, busy, error, consent, setConsent, run, clear, reviseEntryText, addContext, contextAnswers, reviseCapabilityEntry, removeCapabilityEntry, setInterview };
}
type Session = ReturnType<typeof useSession>;
const PivotContext = createContext<Session | null>(null);
export function PivotProvider({ children }: { children: ReactNode }) { const session = useSession(); return <PivotContext.Provider value={session}>{children}</PivotContext.Provider>; }
export function usePivot() { const session = useContext(PivotContext); if (!session) throw new Error("PivotPoint session missing"); return session; }
