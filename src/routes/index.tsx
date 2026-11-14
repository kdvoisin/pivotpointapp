import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowRight, FileText, Sparkles, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PivotShell, PageIntro } from "@/components/pivot-shell";
import { usePivot } from "@/components/pivot-provider";
import { extractDocument } from "@/lib/documents";
import type { Entry } from "@/lib/pivot";

export const Route = createFileRoute("/")({ head: () => ({ meta: [{ title: "Enter experience — PivotPoint" }, { name: "description", content: "Describe your real experience or upload career materials to discover transferable skills." }, { property: "og:title", content: "Enter experience — PivotPoint" }, { property: "og:description", content: "Find transferable skills grounded in your own words." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: Index });

function Index() {
  const session = usePivot(); const navigate = useNavigate();
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const upload = async (files: FileList | null) => {
    if (!files || uploading || session.busy) return;
    setUploading(true); const entries: Entry[] = []; const errors: string[] = [];
    const documents = session.entries.filter((entry) => entry.id !== "typed-experience");
    for (const file of Array.from(files)) {
      if (documents.length + entries.length >= 19) { errors.push("You can add up to 19 documents alongside your written experience."); break; }
      try { entries.push({ id: crypto.randomUUID(), title: file.name, text: await extractDocument(file) }); }
      catch (error) { errors.push(error instanceof Error ? error.message : "Couldn’t read this file. Please paste text instead."); }
    }
    if (entries.length) session.changeEntries([...session.entries, ...entries]);
    setUploadErrors(errors); setUploading(false); if (fileInput.current) fileInput.current.value = "";
  };
  const discover = async () => {
    const documents = session.entries.filter((entry) => entry.id !== "typed-experience");
    const entries = session.experienceText.trim() ? [{ id: "typed-experience", title: "Your experience", text: session.experienceText.trim() }, ...documents] : documents;
    session.changeEntries(entries);
    if (await session.run(false, entries)) void navigate({ to: "/remix" });
  };
  return <PivotShell><PageIntro step={1} title="Enter your experience." subtitle="Start with what you’ve actually done. Your next chapter begins in your own words." />
    <div className="experience-column">
      <section><label className="section-heading" htmlFor="experience">Describe or paste your experience</label><Textarea id="experience" className="experience-text mt-4 min-h-48" maxLength={30000} value={session.experienceText} disabled={session.busy} onChange={(e) => { session.setExperienceText(e.target.value); session.changeEntries(session.entries); }} placeholder="A project, an everyday responsibility, or a problem you helped solve…" /><div className="field-foot"><span>Paid or unpaid, big or small.</span><span>{session.experienceText.length.toLocaleString()} / 30,000</span></div></section>
      <section className="mt-7"><h2 className="section-heading">Upload a file</h2><input ref={fileInput} type="file" multiple className="hidden" accept=".pdf,.docx,.odt,.txt" disabled={uploading || session.busy} onChange={(e) => void upload(e.target.files)} />
        <div className={`upload-zone mt-4 ${dragging ? "dragging" : ""}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); void upload(e.dataTransfer.files); }}><Upload aria-hidden="true" /><strong>{uploading ? "Reading your file…" : "Drag and drop your file here"}</strong><Button variant="outline" size="sm" disabled={uploading || session.busy} onClick={() => fileInput.current?.click()}>Browse files</Button><span>PDF, DOCX, ODT, TXT · Up to 10 MB each</span></div>
        {session.entries.filter((entry) => entry.id !== "typed-experience").map((entry) => <div className="uploaded-file" key={entry.id}><FileText size={16} /><span>{entry.title}</span><Button variant="ghost" size="icon" disabled={session.busy || uploading} title="Remove file" aria-label={`Remove ${entry.title}`} onClick={() => session.changeEntries(session.entries.filter((item) => item.id !== entry.id))}><Trash2 /></Button></div>)}
        {uploadErrors.map((error) => <p className="error-message" role="alert" key={error}>{error}</p>)}
      </section>
      <label className="privacy-consent"><input type="checkbox" checked={session.consent} disabled={session.busy} onChange={(e) => session.setConsent(e.target.checked)} /><span>I agree to send my text and extracted document content to the AI provider for analysis. Materials stay in this session only. Avoid sensitive personal information.</span></label>
      {session.error && <p className="error-message" role="alert">{session.error}</p>}
      <div className="journey-actions"><Button variant="discover" disabled={(!session.experienceText.trim() && !session.entries.some((entry) => entry.id !== "typed-experience")) || !session.consent || session.busy || uploading} onClick={() => void discover()}><Sparkles />{session.busy ? "Finding your capabilities…" : "Discover my capabilities"}<ArrowRight /></Button></div>
    </div>
  </PivotShell>;
}
