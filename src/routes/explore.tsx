import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ExternalLink, Loader2, SearchX } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageIntro, PivotShell } from "@/components/pivot-shell";
import { usePivot } from "@/components/pivot-provider";
import { EvidenceLabel } from "@/components/evidence";

export const Route = createFileRoute("/explore")({ head: () => ({ meta: [{ title: "See the bridge — PivotPoint" }, { name: "description", content: "See how each selected skill transfers to your target role, with original evidence and honest limitations." }, { property: "og:title", content: "See the bridge — PivotPoint" }, { property: "og:description", content: "Your original experience, translated to a new role without invented claims." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: Explore });

function BridgeSkill({ index, skill }: { index: number; skill: import("@/lib/pivot").SkillTranslation }) {
  const session = usePivot();
  const [answer, setAnswer] = useState("");
  const answered = session.contextAnswers[skill.capability];
  const source = session.entries.find((entry) => entry.id === skill.evidence.sourceId);
  const interviewId = `interview-${index}`;
  return <article className="bridge-skill">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">{skill.capability}</h3><EvidenceLabel status={skill.evidence.status} /></div>
    <div className="bridge-columns"><div><p className="eyebrow mb-3">Your original experience</p><blockquote className="source-quote">{skill.evidence.quote ? `“${skill.evidence.quote}”` : "A matching source passage was not established."}<small>{source?.title || "No supporting source"}</small></blockquote></div><ArrowRight className="mt-12 text-primary" /><div><p className="eyebrow mb-3">In the target role’s language</p><div className="bridge-reason"><h3>{skill.term}</h3><p>{skill.evidence.reasoning}</p>{skill.evidence.question && <p className="mt-3"><strong className="text-foreground">Missing context: </strong>{skill.evidence.question}</p>}</div></div></div>
    {skill.evidence.question && (answered ? <p className="answered-note">Context you added: {answered}</p> : <div className="context-answer"><Input aria-label={`Context for ${skill.capability}`} placeholder="Answer the missing-context question…" value={answer} maxLength={1500} disabled={session.busy} onChange={(event) => setAnswer(event.target.value)} /><Button variant="outline" size="sm" disabled={session.busy || !answer.trim()} onClick={() => { session.addContext(skill.capability, skill.evidence.sourceId, answer); setAnswer(""); }}>Add context</Button></div>)}
    <div className="interview-edit"><label className="field-label" htmlFor={interviewId}>Explain this in an interview</label><Textarea id={interviewId} className="min-h-24" maxLength={1200} value={skill.interview} disabled={session.busy} onChange={(event) => session.setInterview(skill.capability, event.target.value)} /><p className="guide-copy mt-2">Yours to rewrite in your own words. Keep it to what the experience above actually supports.</p></div>
  </article>;
}

function OccupationResults() {
  const session = usePivot(); const { matches, matchState } = session;
  const capability = (name: string) => session.analysis?.capabilities.find((c) => c.name === name);
  return <section className="mt-8"><h2 className="section-heading">Occupations that connect to your skills</h2>
    <p className="guide-copy mt-3">O*NET is a U.S. Department of Labor–sponsored database of occupations, skills, and job responsibilities. PivotPoint uses it to explore career possibilities and connect your experience to the work those roles typically involve.</p>
    {matches.map((m) => <article key={m.code} className="bridge-skill"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">{m.title} <span className="count-label">{m.code}</span></h3><span className="count-label">{m.strength} match</span></div><p className="guide-copy mt-2">{m.description}</p>
      {m.connections.map((c, i) => { const cap = capability(c.capability); return <div key={i} className="bridge-columns"><div><p className="eyebrow mb-3">Your experience · {c.capability}</p><blockquote className="source-quote">{cap?.evidence.quote ? `“${cap.evidence.quote}”` : "A matching source passage was not established."}</blockquote>{cap && <span className="mt-2 inline-block"><EvidenceLabel status={cap.evidence.status} /></span>}</div><ArrowRight className="mt-12 text-primary" /><div><p className="eyebrow mb-3">O*NET responsibility</p><div className="bridge-reason"><h3>{c.responsibility}</h3><p>{c.why}</p></div></div></div>; })}
      {m.gaps && <p className="guide-copy mt-3"><strong className="text-foreground">Gaps to consider: </strong>{m.gaps}</p>}
      <a className="mt-3 inline-flex items-center gap-1 text-sm text-primary underline" href={m.link} target="_blank" rel="noreferrer">View on O*NET OnLine <ExternalLink size={14} /></a></article>)}
    {matchState.busy && <p className="guide-copy mt-6 inline-flex items-center gap-2" role="status"><Loader2 className="animate-spin" size={16} />Searching the occupation catalog…</p>}
    {matchState.error && <p className="error-message" role="alert">{matchState.error}</p>}
    {!matchState.busy && !matchState.error && !matches.length && <div className="jobs-unavailable"><SearchX size={28} className="text-primary" /><p className="guide-copy mt-3">No occupations with a clear connection were found yet.</p></div>}
    {!matchState.busy && (matchState.hasMore || matchState.error) && <Button variant="outline" className="mt-5" onClick={() => void session.exploreMore(matchState.error && !matches.length ? 0 : undefined)}>{matchState.error ? "Try again" : "Explore more"}</Button>}
    <p className="guide-copy mt-6 text-xs">Occupation data: {matchState.release ? `O*NET ${matchState.release}` : "O*NET"} Database by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA), used under the <a className="underline" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a> license. O*NET® is a trademark of USDOL/ETA. PivotPoint has modified and ranked this information.</p>
    <Button asChild variant="ghost" className="mt-4"><Link to="/remix"><ArrowLeft />Change skills or direction</Link></Button></section>;
}

function Explore() {
  const session = usePivot(); const pathway = session.bridge?.pathways[0];
  return <PivotShell><PageIntro step={3} title="See your bridge." subtitle={session.bridgeReady && session.mode !== "options" && pathway ? `Your selected skills → ${session.mode === "title" ? session.direction : pathway.title}` : "Connections grounded in what you’ve actually done."} />
    {!session.bridgeReady ? <section className="mt-8"><p className="guide-copy">Choose your skills and direction before discovering your bridge.</p><Button asChild className="mt-4"><Link to={session.analysis ? "/remix" : "/"}>{session.analysis ? "Choose skills and a direction" : "Enter experience"}<ArrowRight /></Link></Button></section> : session.mode === "options" ? <OccupationResults /> : pathway ? <section className="mt-8"><h2 className="section-heading">{pathway.title}</h2><p className="guide-copy mt-3">Supported means grounded in your material, not independently verified. A transferable connection is not a guarantee of qualification.</p>{pathway.skills.map((skill, index) => <BridgeSkill key={skill.capability} index={index} skill={skill} />)}</section> : null}
    {session.bridgeReady && session.mode !== "options" && <Button asChild variant="ghost" className="mt-4"><Link to="/remix"><ArrowLeft />Change skills or direction</Link></Button>}
  </PivotShell>;
}
