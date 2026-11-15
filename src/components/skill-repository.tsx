import { useState } from "react";
import { FileText, PencilLine, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EvidenceLabel } from "@/components/evidence";
import { usePivot } from "@/components/pivot-provider";
import type { Capability } from "@/lib/pivot";

function RepositoryEntry({ capability }: { capability: Capability }) {
  const session = usePivot();
  const [editingSource, setEditingSource] = useState(false);
  const [answer, setAnswer] = useState("");
  const source = session.entries.find((entry) => entry.id === capability.evidence.sourceId);
  const answered = session.contextAnswers[capability.name];
  const submitAnswer = () => {
    if (!answer.trim()) return;
    session.addContext(capability.name, capability.evidence.sourceId, answer);
    setAnswer("");
  };
  return <article className="repository-entry">
    <div className="entry-row-header">
      <Input className="skill-name-input" aria-label="Skill name" value={capability.name} maxLength={120} disabled={session.busy} onChange={(event) => session.reviseCapabilityEntry(capability.id, { name: event.target.value })} />
      <Button variant="ghost" size="icon" aria-label={`Remove ${capability.name}`} title="Remove this skill" disabled={session.busy} onClick={() => session.removeCapabilityEntry(capability.id)}><Trash2 /></Button>
    </div>
    <Textarea className="skill-description-input min-h-16" aria-label={`Description of ${capability.name}`} value={capability.description} maxLength={600} disabled={session.busy} onChange={(event) => session.reviseCapabilityEntry(capability.id, { description: event.target.value })} />
    <div className="flex flex-wrap items-center gap-8 mt-3"><EvidenceLabel status={capability.evidence.status} /><span className="count-label">{capability.evidence.status === "Supported" ? "Grounded in your material, not independently verified" : capability.evidence.status === "Needs context" ? "A detail is missing" : "Your material doesn’t establish this yet"}</span></div>
    <blockquote className="source-quote mt-3">{capability.evidence.quote ? `“${capability.evidence.quote}”` : "No matching source passage was established."}<small><FileText size={11} className="inline mr-1" />{source?.title || "No supporting source"}</small></blockquote>
    {editingSource && source ? <div className="mt-3"><label className="field-label" htmlFor={`source-${capability.id}`}>Correct the supporting experience</label><Textarea id={`source-${capability.id}`} className="min-h-32" value={source.text} maxLength={30000} disabled={session.busy} onChange={(event) => session.reviseEntryText(source.id, event.target.value)} /><p className="guide-copy mt-2">Editing this text re-checks every quote. If a quote no longer matches, its label changes and your bridge is cleared for a fresh run.</p><Button variant="ghost" size="sm" className="mt-2" onClick={() => setEditingSource(false)}><X />Close</Button></div>
      : <Button variant="ghost" size="sm" className="mt-2" disabled={!source || session.busy} onClick={() => setEditingSource(true)}><PencilLine />Correct the supporting experience</Button>}
    {capability.evidence.question && (answered ? <p className="answered-note">Context you added: {answered}</p> : <div className="context-answer"><Input aria-label={`Answer for ${capability.name}`} placeholder={capability.evidence.question} value={answer} maxLength={1500} disabled={session.busy} onChange={(event) => setAnswer(event.target.value)} /><Button variant="outline" size="sm" disabled={session.busy || !answer.trim()} onClick={submitAnswer}>Add context</Button></div>)}
  </article>;
}

export function SkillRepository() {
  const session = usePivot();
  const capabilities = session.analysis?.capabilities ?? [];
  return <section className="skill-repository" aria-labelledby="repository-heading">
    <div className="repository-title"><h2 className="section-heading" id="repository-heading">Skills repository</h2><span className="count-label">{session.analysis ? `${capabilities.length} identified this session` : "Nothing identified yet"}</span></div>
    {capabilities.length ? capabilities.map((capability) => <RepositoryEntry key={capability.id} capability={capability} />)
      : <div className="empty-repository"><Sparkles size={20} /><span>Discover your capabilities and your identified skills appear here with the experience behind them. You can correct or remove any of them, and they stay for this session.</span></div>}
  </section>;
}
