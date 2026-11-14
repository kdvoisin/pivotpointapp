import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Square, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageIntro, PivotShell } from "@/components/pivot-shell";
import { usePivot } from "@/components/pivot-provider";
import { EvidenceLabel } from "@/components/evidence";
import { canDiscoverBridge, pivotModeSchema } from "@/lib/pivot";

export const Route = createFileRoute("/remix")({ head: () => ({ meta: [{ title: "Choose skills and a direction — PivotPoint" }, { name: "description", content: "Select the skills you want to transfer and choose a target job title, job description, or explore options." }, { property: "og:title", content: "Choose skills and a direction — PivotPoint" }, { property: "og:description", content: "Choose what you want to carry forward and where you want to pivot." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: Remix });
function Remix() {
  const session = usePivot(); const navigate = useNavigate();
  return <PivotShell><PageIntro step={2} title="Choose skills and a direction." subtitle="Your experience stays the same. You choose what comes with you." />{!session.analysis ? <section className="mt-8"><p className="guide-copy">Add your experience first to discover your skills.</p><Button asChild className="mt-5"><Link to="/">Enter experience<ArrowRight /></Link></Button></section> : <>
    <div className="skills-direction-grid">
      <section><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="section-heading">Select the skills you want to transfer</h2><span className="count-label">{session.selected.length} selected</span></div><div className="skill-selection-list">{session.analysis.capabilities.map((capability) => { const selected = session.selected.includes(capability.name); const Icon = selected ? Check : Square; return <Button key={capability.id} disabled={session.busy} variant="ghost" className={`capability-tile w-full ${selected ? "selected" : ""}`} aria-pressed={selected} onClick={() => session.setSelected(selected ? session.selected.filter((name) => name !== capability.name) : [...session.selected, capability.name])}><Icon className="mt-1 shrink-0" /><span className="min-w-0"><span className="block text-sm font-semibold">{capability.name}</span><span className="skill-description">{capability.description}</span><span className="mt-3 inline-block"><EvidenceLabel status={capability.evidence.status} /></span></span></Button>; })}</div></section>
      <section className="pivot-direction"><h2 className="section-heading">Where do you want to pivot?</h2><label className="field-label" htmlFor="pivot-mode">Your direction</label><Select value={session.mode} disabled={session.busy} onValueChange={(value) => session.setMode(pivotModeSchema.parse(value))}><SelectTrigger id="pivot-mode" aria-label="Your direction"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="title">Job title</SelectItem><SelectItem value="description">Job description</SelectItem><SelectItem value="options">Explore my options</SelectItem></SelectContent></Select>
        {session.mode === "title" && <><label className="field-label" htmlFor="direction">Job title</label><Input id="direction" disabled={session.busy} value={session.direction} maxLength={1000} placeholder="For example: Customer Success Manager" onChange={(e) => session.setDirection(e.target.value)} /></>}
        {session.mode === "description" && <><label className="field-label" htmlFor="job-description">Job description</label><Textarea id="job-description" disabled={session.busy} className="min-h-48" maxLength={15000} placeholder="Paste the job description…" value={session.jobDescription} onChange={(e) => session.setJobDescription(e.target.value)} /></>}
        {session.mode === "options" && <p className="guide-copy mt-4">A current job-search source is not connected. Verified job openings aren’t available yet.</p>}
      </section>
    </div>
    {session.error && <p className="error-message" role="alert">{session.error}</p>}
    <div className="journey-actions"><p className="text-xs text-muted-foreground">{!session.selected.length ? "Select at least one skill to continue." : session.mode !== "options" && !canDiscoverBridge(session.selected, session.mode, session.direction, session.jobDescription) ? "Add your target role to continue." : `${session.selected.length} skill${session.selected.length === 1 ? "" : "s"} ready to carry forward.`}</p><Button variant="discover" disabled={!canDiscoverBridge(session.selected, session.mode, session.direction, session.jobDescription) || session.busy || !session.consent} onClick={async () => { if (await session.run(true)) void navigate({ to: "/explore" }); }}><Sparkles />{session.busy ? "Translating your skills…" : "Discover my bridge"}<ArrowRight /></Button></div>
  </>}
  </PivotShell>;
}
