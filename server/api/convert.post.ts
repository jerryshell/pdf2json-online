import PDFParser from "pdf2json";

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event);
  const file = form?.find((item) => item.name === "file");

  if (!file?.data) {
    throw createError({ statusCode: 400, message: "No file uploaded" });
  }

  if (!file.filename?.toLowerCase().endsWith(".pdf")) {
    throw createError({ statusCode: 400, message: "Only PDF files are supported" });
  }

  return parsePdf(file.data);
});

function parsePdf(buffer: Buffer) {
  const parser = new PDFParser();

  return new Promise((resolve, reject) => {
    parser.on("pdfParser_dataError", (errData) => {
      const error = "parserError" in errData ? errData.parserError : errData;
      reject(error || "Failed to parse PDF");
    });

    parser.on("pdfParser_dataReady", resolve);
    parser.parseBuffer(buffer);
  });
}
