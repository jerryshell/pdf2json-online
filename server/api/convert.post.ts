import PDFParser from "pdf2json";

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event);

  if (!form?.length) {
    throw createError({
      statusCode: 400,
      message: "No file uploaded",
    });
  }

  const file = form.find((item) => item.name === "file");

  if (!file?.data) {
    throw createError({
      statusCode: 400,
      message: "No file found",
    });
  }

  if (!file.filename?.toLowerCase().endsWith(".pdf")) {
    throw createError({
      statusCode: 400,
      message: "Only PDF files are supported",
    });
  }

  try {
    const pdfParser = new PDFParser();

    const pdfData = await new Promise((resolve, reject) => {
      pdfParser.on("pdfParser_dataError", (errData) => {
        const message = "parserError" in errData ? String(errData.parserError) : String(errData);
        reject(message || "Failed to parse PDF");
      });

      pdfParser.on("pdfParser_dataReady", (data) => {
        resolve(data);
      });

      pdfParser.parseBuffer(file.data);
    });

    return pdfData;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    throw createError({
      statusCode: 500,
      message,
    });
  }
});
