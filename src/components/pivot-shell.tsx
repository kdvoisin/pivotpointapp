import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LockKeyhole, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { usePivot } from "./pivot-provider";
import landscape from "@/assets/landscape-bridge.jpg";

export function PivotShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const session = usePivot();
  return <div className={`pivot-interface ${location.pathname === "/" ? "discover-interface" : "journey-interface"}`}>
    <aside className="app-sidebar"><Link to="/" className="brand"><span className="brand-symbol"><Sparkles size={20} /></span><span>PivotPoint</span></Link><p className="eyebrow">Your workspace</p><nav className="journey-nav" aria-label="Your journey">{[{ to: "/" as const, label: "Enter experience" }, { to: "/remix" as const, label: "Remix It" }, { to: "/explore" as const, label: "See the bridge" }].map((step, i) => <Link key={step.to} to={step.to} aria-current={location.pathname === step.to ? "page" : undefined} className={`journey-link ${location.pathname === step.to ? "active" : ""}`}><span className="step-number">{i + 1}</span>{step.label}</Link>)}</nav><div className="sidebar-note"><p><LockKeyhole size={13} /> Session only</p><Button variant="ghost" size="sm" disabled={!session.entries.length && !session.consent && !session.experienceText} onClick={() => { if (window.confirm("Clear all experience, documents and analysis from this session?")) { session.clear(); void navigate({ to: "/" }); } }}><Trash2 size={13} /> Clear session</Button></div></aside>
    <div className="app-layout"><main className="app-main">{children}<footer className="app-footer"><span>PivotPoint · Career exploration grounded in your experience</span><span><ShieldCheck size={14} /> Session only · AI-powered analysis</span></footer></main></div></div>;
}

export function PageIntro({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return <><div className="page-topline"><span className="studio-label">Career Studio</span><span className="step-label">Step {step} of 3</span></div><section className="studio-banner"><img src={landscape} alt="" width={1920} height={1280} /><div className="banner-copy"><p className="eyebrow">0{step} · {step === 1 ? "Experience" : step === 2 ? "Skills & direction" : "Your bridge"}</p><h1 className="page-title">{title}</h1><p className="page-subtitle">{subtitle}</p></div></section></>;
}