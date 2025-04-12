import { type NextRequest, NextResponse } from "next/server"
import PDFDocument from "pdfkit"
import path from "path";

const fontPath = path.join(process.cwd(), "public", "fonts", "Roboto-Regular.ttf");
export async function POST(req: NextRequest) {
  try {
    const { resumeText } = await req.json()

    if (!resumeText) {
      return NextResponse.json({ error: "Resume text is required" }, { status: 400 })
    }

    // Generate PDF from the resume text
    const pdfBuffer = await generateResumePDF(resumeText)

    // Return the PDF as a downloadable file
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=optimized-resume.pdf",
      },
    })
  } catch (error: any) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: error.message || "Failed to generate PDF" }, { status: 500 })
  }
}

async function generateResumePDF(resumeText: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
      })
      doc.font(fontPath);
      // Collect the PDF data chunks
      const chunks: Buffer[] = []
      doc.on("data", (chunk) => chunks.push(chunk))
      doc.on("end", () => resolve(Buffer.concat(chunks)))

      // Set font and size
      

      // Parse the resume text to identify sections
      const sections = resumeText.split(/\n{2,}/)

      // Add title
      doc.fontSize(18).text("OPTIMIZED RESUME", { align: "center" })
      doc.moveDown(1)

      // Process each section
      sections.forEach((section, index) => {
        // Check if this is a section header
        const lines = section.split("\n")
        const firstLine = lines[0]

        if (firstLine.includes(":") && firstLine.length < 50) {
          // This is likely a section header
          const [header] = firstLine.split(":")
          doc.fontSize(14).text(header.trim(), { underline: true })
          doc.moveDown(0.5)

          // Add the rest of the section content
          const content = lines.slice(1).join("\n").trim()
          doc.fontSize(10).text(content)
        } else {
          // Regular content
          doc.fontSize(10).text(section)
        }

        doc.moveDown(1)
      })

      // Finalize the PDF
      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}
