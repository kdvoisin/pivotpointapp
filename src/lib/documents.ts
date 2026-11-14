export async function extractDocument(file: File): Promise<string> {
  if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name} is larger than 10 MB. Please paste the relevant text instead.`);
  const extension = file.name.split(".").pop()?.toLowerCase();
  let text = "";
  if (extension === "txt") text = await file.text();
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
    throw new Error(`${file.name}: ${extension?.toUpperCase() || "This format"} isn’t supported yet. Please save as PDF, DOCX, ODT or TXT, or paste the text.`);
  }
  if (!text.trim()) throw new Error(`${file.name} has no readable text. Scanned PDFs aren’t supported; please paste the text instead.`);
  if (text.length > 30000) throw new Error(`${file.name} contains too much text. Please paste the relevant sections (up to 30,000 characters).`);
  return text.trim();
}