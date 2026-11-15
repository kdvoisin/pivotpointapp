import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, SearchX } from "lucide-react";
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

function Explore() {
  const session = usePivot(); const pathway = session.bridge?.pathways[0];
  return <PivotShell><PageIntro step={3} title="See your bridge." subtitle={session.bridgeReady && session.mode !== "options" && pathway ? `Your selected skills → ${session.mode === "title" ? session.direction : pathway.title}` : "Connections grounded in what you’ve actually done."} />
    {!session.bridgeReady ? <section className="mt-8"><p className="guide-copy">Choose your skills and direction before discovering your bridge.</p><Button asChild className="mt-4"><Link to={session.analysis ? "/remix" : "/"}>{session.analysis ? "Choose skills and a direction" : "Enter experience"}<ArrowRight /></Link></Button></section> : session.mode === "options" ? <section className="jobs-unavailable"><SearchX size={32} className="text-primary" /><h2 className="section-heading mt-4">Real jobs aren’t available yet.</h2><p className="guide-copy mt-3">A current job-search data source is not connected. We can’t verify current openings, employers, locations, direct links, posting dates or salary, so no listings are shown — an invented listing would be worse than none.</p><p className="guide-copy mt-3">Your {session.selected.length} selected skill{session.selected.length === 1 ? " is" : "s are"} still here. You can enter a job title or paste a job description to see how they transfer.</p><Button asChild variant="outline" className="mt-5"><Link to="/remix"><ArrowLeft />Choose a target role</Link></Button></section> : pathway ? <section className="mt-8"><h2 className="section-heading">{pathway.title}</h2><p className="guide-copy mt-3">Supported means grounded in your material, not independently verified. A transferable connection is not a guarantee of qualification.</p>{pathway.skills.map((skill, index) => <BridgeSkill key={skill.capability} index={index} skill={skill} />)}</section> : null}
    {session.bridgeReady && session.mode !== "options" && <Button asChild variant="ghost" className="mt-4"><Link to="/remix"><ArrowLeft />Change skills or direction</Link></Button>}
  </PivotShell>;
}
