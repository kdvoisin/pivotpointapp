import { Check, CircleHelp, Minus } from "lucide-react";
import type { Evidence } from "@/lib/pivot";
export function EvidenceLabel({ status }: { status: Evidence["status"] }) {
  const Icon = status === "Supported" ? Check : status === "Needs context" ? CircleHelp : Minus;
  return <span className={`evidence-label ${status === "Needs context" ? "context" : status === "Not established" ? "absent" : ""}`} title={status === "Supported" ? "Grounded in your submitted material, not independently verified." : status === "Not established" ? "Your material does not establish this experience; it does not mean you lack the skill." : "More information is needed to support this connection."}><Icon size={11} />{status}</span>;
}