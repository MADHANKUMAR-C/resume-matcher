import { type NextRequest, NextResponse } from "next/server"
import * as pdfLib from "pdf-lib"

export async function POST(req: NextRequest) {
  try {
    const { resumeText } = await req.json()

    if (!resumeText) {
      return NextResponse.json({ error: "Resume text is required" }, { status: 400 })
    }

    // Create a new PDF document
    const pdfDoc = await pdfLib.PDFDocument.create()
    const page = pdfDoc.addPage([612, 792]) // Letter size
    const { width, height } = page.getSize()

    // Add text to the PDF
    const fontSize = 11
    const lineHeight = fontSize * 1.2
    const margin = 50

    // Split text into lines
    const lines = resumeText.split("\n")

    // Add each line to the PDF
    let y = height - margin

    for (const line of lines) {
      if (y < margin) {
        // Add a new page if we run out of space
        const newPage = pdfDoc.addPage([612, 792])
        y = newPage.getSize().height - margin
      }

      page.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        color: pdfLib.rgb(0, 0, 0),
      })

      y -= lineHeight
    }

    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save()

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="optimized-resume.pdf"',
      },
    })
  } catch (error: any) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: error.message || "Failed to generate PDF" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
