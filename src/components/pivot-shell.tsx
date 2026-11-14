import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Compass, LockKeyhole, ShieldCheck, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { usePivot } from "./pivot-provider";

export function PivotShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const session = usePivot();
  return <><header className="app-header"><div className="header-inner"><Link to="/" className="brand"><Compass className="brand-mark" strokeWidth={1.8} /><span>Pivot<span className="brand-point">Point</span><span className="text-primary">.</span></span></Link><span className="session-label"><LockKeyhole size={13} /> Your journey. Your terms.</span></div></header>
    <div className="app-layout"><aside className="app-sidebar"><p className="eyebrow">Your next chapter</p><nav className="journey-nav" aria-label="Your journey">{[{ to: "/" as const, label: "Discover experience" }, { to: "/remix" as const, label: "Role Remix" }, { to: "/explore" as const, label: "Explore the bridge" }].map((step, i) => <Link key={step.to} to={step.to} className={`journey-link ${location.pathname === step.to ? "active" : ""}`}><span className="step-number">{i + 1}</span>{step.label}</Link>)}</nav><div className="sidebar-note"><ShieldCheck size={21} /><p>A little space to think bigger.<br />No account needed.<br />Nothing saved beyond this session.</p><Button variant="ghost" size="sm" className="mt-4 -ml-3" disabled={!session.entries.length && !session.consent} onClick={() => { if (window.confirm("Clear all experience, documents and analysis from this session?")) { session.clear(); void navigate({ to: "/" }); } }}><Trash2 size={13} /> Clear session</Button></div></aside><main className="app-main">{children}<footer className="app-footer"><span>Grounded in your experience. Open to possibility.</span><span>PivotPoint · A new perspective</span></footer></main></div></>;
}

export function PageIntro({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  const session = usePivot();
  return <><div className="page-topline"><span className="step-label">STEP {step} OF 3</span><span className="session-label"><LockKeyhole size={12} /> Session only <Button variant="ghost" size="icon" title="Clear session" aria-label="Clear session" disabled={!session.entries.length && !session.consent} onClick={() => { if (window.confirm("Clear your session materials and analysis?")) session.clear(); }}><Trash2 size={13} /></Button></span></div><h1 className="page-title">{title}</h1><p className="page-subtitle">{subtitle}</p></>;
}