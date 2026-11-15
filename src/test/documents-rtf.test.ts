import { describe, expect, it } from "vitest";
import { extractRtfText, supportedUploadFormats } from "@/lib/documents";

describe("RTF reading", () => {
  it("keeps readable text and drops control words, stylesheets and fonts", () => {
    const rtf = "{\\rtf1\\ansi\\deff0 {\\fonttbl{\\f0 Arial;}} {\\*\\stylesheet {\\s1 Heading;}}\\pard I wrote a training guide\\par and answered questions\\par}";
    expect(extractRtfText(rtf)).toBe("I wrote a training guide\nand answered questions");
  });
  it("decodes hex escapes and unicode escapes with their fallback characters", () => {
    expect(extractRtfText("{\\rtf1 I wrote a \\u8216? training guide\\par}")).toBe("I wrote a ‘ training guide");
    expect(extractRtfText("{\\rtf1caf\\u233? \\par}")).toBe("café");
    expect(extractRtfText("{\\rtf1caf\\'e9\\par}")).toBe("café");
  });
  it("keeps literal braces and backslashes", () => {
    expect(extractRtfText("{\\rtf1 use \\{ and \\} and \\\\ here\\par}")).toBe("use { and } and \\ here");
  });
  it("lists only formats the app can actually read", () => {
    expect(supportedUploadFormats).toBe("PDF, DOCX, RTF, ODT, TXT");
  });
});
