import { validateMatches, type Candidate } from "@/lib/occupations";
const candidates: Candidate[] = [{ code: "29-1141.00", title: "Registered Nurses", description: "Assess patient health problems.", tasks: ["Monitor patients."], skills: ["Active Listening"], activities: [] }];
const base = { strength: "Strong" as const, gaps: "", connections: [{ capability: "Care", responsibility: "Monitor patients.", why: "x" }] };
describe("occupation validation", () => {
  it("keeps records that exist in the catalog", () => expect(validateMatches([{ ...base, code: "29-1141.00", title: "Registered Nurses" }], candidates, ["Care"])).toHaveLength(1));
  it("drops invented codes", () => expect(validateMatches([{ ...base, code: "99-9999.00", title: "Registered Nurses" }], candidates, ["Care"])).toHaveLength(0));
  it("drops altered titles", () => expect(validateMatches([{ ...base, code: "29-1141.00", title: "Senior Nurse" }], candidates, ["Care"])).toHaveLength(0));
  it("drops responsibilities not in the record", () => expect(validateMatches([{ ...base, code: "29-1141.00", title: "Registered Nurses", connections: [{ capability: "Care", responsibility: "Perform surgery.", why: "x" }] }], candidates, ["Care"])).toHaveLength(0));
  it("drops unselected capabilities", () => expect(validateMatches([{ ...base, code: "29-1141.00", title: "Registered Nurses" }], candidates, ["Other"])).toHaveLength(0));
});
