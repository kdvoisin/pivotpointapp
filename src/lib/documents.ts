export const supportedUploadFormats = "PDF, DOCX, RTF, ODT, TXT";
export const uploadAccept = ".pdf,.docx,.doc,.rtf,.odt,.txt";

const cp1252: Record<number, string> = {
  0x80: "€", 0x82: "‚", 0x83: "ƒ", 0x84: "„", 0x85: "…", 0x86: "†", 0x87: "‡", 0x88: "ˆ", 0x89: "‰", 0x8a: "Š", 0x8b: "‹", 0x8c: "Œ", 0x8e: "Ž",
  0x91: "‘", 0x92: "’", 0x93: "“", 0x94: "”", 0x95: "•", 0x96: "–", 0x97: "—", 0x98: "˜", 0x99: "™", 0x9a: "š", 0x9b: "›", 0x9c: "œ", 0x9e: "ž", 0x9f: "Ÿ",
};

function rtfByteToChar(byte: number): string {
  if (byte < 0x20) return byte === 0x0a ? "\n" : "";
  if (byte < 0x80) return String.fromCharCode(byte);
  return cp1252[byte] ?? String.fromCharCode(byte);
}

// Reads readable text out of RTF: drops control words and destinations,
// decodes \'xx and \uN escapes, and keeps paragraph breaks.
const rtfDestinations = new Set(["fonttbl", "stylesheet", "info", "colortbl", "generator", "listtable", "listoverridetable", "preamble", "header", "footer", "pgdsc", "themebgen", "xmlnstbl", "datastore", "expr", "bmmath", "mmath", "nonshppict"]);

export function extractRtfText(source: string): string {
  const at = (index: number) => source[index] ?? "";
  let out = "";
  let i = 0;
  let unicodeFallback = false;
  const skip = [false];
  while (i < source.length) {
    const char = source[i];
    if (char === "{") { skip.push(skip[skip.length - 1] ?? false); i += 1; continue; }
    if (char === "}") { if (skip.length > 1) skip.pop(); i += 1; continue; }
    if (char === "\n" || char === "\r") { i += 1; continue; }
    if (char !== "\\") {
      if (!skip[skip.length - 1] && !unicodeFallback) out += char;
      unicodeFallback = false;
      i += 1;
      continue;
    }
    i += 1;
    const next = source[i];
    if (next === undefined) break;
    if (next === "\\" || next === "{" || next === "}") {
      if (!skip[skip.length - 1] && !unicodeFallback) out += next;
      unicodeFallback = false;
      i += 1;
      continue;
    }
    if (next === "'") {
      const byte = Number.parseInt(source.slice(i + 1, i + 3), 16);
      if (!Number.isNaN(byte)) {
        if (!skip[skip.length - 1] && !unicodeFallback) out += rtfByteToChar(byte);
        i += 3;
      } else i += 1;
      unicodeFallback = false;
      continue;
    }
    if (next === "*") { skip[skip.length - 1] = true; i += 1; continue; }
    if (next === "u") {
      let j = i + 1;
      let sign = 1;
      if (at(j) === "-") { sign = -1; j += 1; }
      let digits = "";
      while (j < source.length && at(j) >= "0" && at(j) <= "9") { digits += at(j); j += 1; }
      const code = sign * Number.parseInt(digits || "0", 10);
      if (!skip[skip.length - 1] && !unicodeFallback && code > 31) out += String.fromCharCode(code < 0 ? code + 65536 : code);
      i = at(j) === " " ? j + 1 : j;
      unicodeFallback = true;
      continue;
    }
    if (/[a-zA-Z]/.test(next)) {
      let j = i;
      let word = "";
      while (j < source.length && /[a-zA-Z]/.test(at(j))) { word += at(j); j += 1; }
      let k = j;
      let param = "";
      if (at(k) === "-") { param = "-"; k += 1; }
      while (k < source.length && at(k) >= "0" && at(k) <= "9") { param += at(k); k += 1; }
      if (param !== "-") j = k;
      if (at(j) === " ") j += 1;
      const lower = word.toLowerCase();
      if (rtfDestinations.has(lower)) { skip[skip.length - 1] = true; unicodeFallback = false; i = j; continue; }
      if (!skip[skip.length - 1] && !unicodeFallback) {
        if (lower === "par" || lower === "line" || lower === "row" || lower === "cell" || lower === "sect") out += "\n";
        else if (lower === "tab") out += "\t";
      }
      unicodeFallback = false;
      i = j;
      continue;
    }
    if (!skip[skip.length - 1] && !unicodeFallback && (next === "~" || next === "_")) out += " ";
    unicodeFallback = false;
    i += 1;
  }
  return out.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export async function extractDocument(file: File): Promise<string> {
  if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name} is larger than 10 MB. Please paste the relevant text instead.`);
  const extension = file.name.split(".").pop()?.toLowerCase();
  let text = "";
  if (extension === "txt") text = await file.text();
  else if (extension === "rtf") text = extractRtfText(await file.text());
  else if (extension === "doc") throw new Error(`${file.name} is an older Word .doc file, which can’t be read reliably in the browser. Save it as .docx or PDF, or paste the text here instead.`);
  else if (extension === "docx") {
    const mammoth = await import("mammoth/mammoth.browser");
    text = (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
  } else if (extension === "pdf") {
    const pdf = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdf.GlobalWorkerOptions.workerSrc = worker.default;
    const loadingTask = pdf.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
    const document = await loadingTask.promise;
    try {
      for (let i = 1; i <= document.numPages; i++) {
        const page = await document.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item) => "str" in item ? item.str : "").join(" ") + "\n";
      }
    } finally { await loadingTask.destroy(); }
  } else if (extension === "odt") {
    const { unzipSync, strFromU8 } = await import("fflate");
    const content = unzipSync(new Uint8Array(await file.arrayBuffer()))["content.xml"];
    if (!content) throw new Error("This ODT file has no readable content. Please paste text instead.");
    const xml = new DOMParser().parseFromString(strFromU8(content), "application/xml");
    text = Array.from(xml.getElementsByTagName("text:p")).map((node) => node.textContent).join("\n");
  } else {
    throw new Error(`${file.name}: ${extension?.toUpperCase() || "This format"} isn’t supported yet. Please save as ${supportedUploadFormats}, or paste the text.`);
  }
  if (!text.trim()) throw new Error(`${file.name} has no readable text. Scanned PDFs and pictures can’t be read without OCR; please paste the text instead.`);
  if (text.length > 30000) throw new Error(`${file.name} contains too much text. Please paste the relevant sections (up to 30,000 characters).`);
  return text.trim();
}
