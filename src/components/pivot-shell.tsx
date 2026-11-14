import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LockKeyhole, ShieldCheck, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { usePivot } from "./pivot-provider";
import landscape from "@/assets/landscape-bridge.jpg";

export function PivotShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const session = usePivot();
  return <div className={`pivot-interface ${location.pathname === "/" ? "discover-interface" : "journey-interface"}`}><img className="landscape-background" src={landscape} alt="" width={1920} height={1280} /><header className="app-header"><div className="header-inner"><Link to="/" className="brand"><svg className="brand-mark" viewBox="0 0 100 64" aria-hidden="true"><path className="brand-sun" d="M34 30a25 25 0 0 1 50 0Z" /><path d="M5 52Q48 8 96 50Q50 23 5 52Z" fill="currentColor" /><path d="M31 40v13M58 33v20M80 41v12" stroke="currentColor" strokeWidth="4" /></svg><span>PivotPoint</span></Link><span className="session-label"><LockKeyhole size={13} /> Your journey. Your terms.</span></div></header>
    <div className="app-layout"><aside className="app-sidebar"><p className="eyebrow">Your next chapter</p><nav className="journey-nav" aria-label="Your journey">{[{ to: "/" as const, label: "Discover experience" }, { to: "/remix" as const, label: "Role Remix" }, { to: "/explore" as const, label: "Explore the bridge" }].map((step, i) => <Link key={step.to} to={step.to} className={`journey-link ${location.pathname === step.to ? "active" : ""}`}><span className="step-number">{i + 1}</span>{step.label}</Link>)}</nav><div className="sidebar-note"><ShieldCheck size={21} /><p>A little space to think bigger.<br />No account needed.<br />Nothing saved beyond this session.</p><Button variant="ghost" size="sm" className="mt-4 -ml-3" disabled={!session.entries.length && !session.consent} onClick={() => { if (window.confirm("Clear all experience, documents and analysis from this session?")) { session.clear(); void navigate({ to: "/" }); } }}><Trash2 size={13} /> Clear session</Button></div></aside><main className="app-main">{children}<footer className="app-footer"><span><LockKeyhole size={13} /> Your information is not saved after this session.</span><span><ShieldCheck size={14} /> Your content is sent to the AI provider for analysis.</span></footer></main></div></div>;
}

export function PageIntro({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  const session = usePivot();
  return <><div className="page-topline"><span className="step-label">STEP {step} OF 3</span><span className="session-label"><LockKeyhole size={12} /> Session only <Button variant="ghost" size="icon" title="Clear session" aria-label="Clear session" disabled={!session.entries.length && !session.consent} onClick={() => { if (window.confirm("Clear your session materials and analysis?")) session.clear(); }}><Trash2 size={13} /></Button></span></div><h1 className="page-title">{title}</h1><p className="page-subtitle">{subtitle}</p></>;
}