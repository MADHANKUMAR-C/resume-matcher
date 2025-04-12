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

      // Define colors and styles
      const primaryColor = "#2563eb" // Blue color
      const secondaryColor = "#64748b" // Slate color
      const lightGray = "#f1f5f9" // Light background for sections


      // Parse the resume text to identify sections
      const sections = resumeText.split(/\n{2,}/)

      // Extract name from the first line (assuming it's the name)
      const name = sections[0].trim()

      // Header with name
      doc.font(fontPath).fontSize(24).fillColor(primaryColor).text(name, { align: "center" }).moveDown(0.5)

      // Contact information (assuming it's in the second section)
      if (sections.length > 1) {
        const contactInfo = sections[1].replace(/[*()]/g, "").trim()
        doc.fontSize(10).fillColor(secondaryColor).text(contactInfo, { align: "center" }).moveDown(1)
      }

      // Process each section
      const currentY = doc.y
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
      const leftColumnWidth = pageWidth * 0.35
      const rightColumnWidth = pageWidth * 0.65
      const rightColumnX = doc.page.margins.left + leftColumnWidth + 10

      // Track which sections go in which column
      const leftColumnSections = ["SKILLS", "EDUCATION", "CERTIFICATIONS", "ONLINE PLATFORMS"]
      const mainSections = ["SUMMARY", "EXPERIENCE", "PROJECTS"]

      // Left column (skills, education, etc.)
      let leftColumnY = currentY

      // Right column (summary, experience, projects)
      let rightColumnY = currentY

      // Process sections
      for (let i = 2; i < sections.length; i++) {
        const section = sections[i].trim()
        if (!section) continue

        // Try to identify section header
        const lines = section.split("\n")
        const firstLine = lines[0].replace(/[*#]/g, "").trim()

        // Check if this is a section header
        const isHeader =
          firstLine.includes(":") ||
          firstLine.toUpperCase() === firstLine ||
          firstLine.startsWith("##") ||
          mainSections.some((s) => firstLine.toUpperCase().includes(s)) ||
          leftColumnSections.some((s) => firstLine.toUpperCase().includes(s))

        if (isHeader) {
          // Clean up the header text
          const header = firstLine.replace(/:/g, "").replace(/##/g, "").trim()

          // Determine which column this section belongs to
          const isLeftColumn = leftColumnSections.some((s) => header.toUpperCase().includes(s))

          if (isLeftColumn) {
            // Position at left column
            doc.x = doc.page.margins.left
            doc.y = leftColumnY

            // Draw section header
            doc
              .fillColor(primaryColor)
              .fontSize(12)
              .font(fontPath)
              .text(header.toUpperCase(), { underline: true })
              .moveDown(0.5)

            // Section content
            doc.fillColor("black").fontSize(10).font(fontPath)

            // Special handling for skills section
            if (header.toUpperCase().includes("SKILL")) {
              // Extract skills as bullet points
              const skillContent = lines.slice(1).join(" ").replace(/\*/g, "").trim()
              const skills = skillContent
                .split(/[,•]/)
                .map((s) => s.trim())
                .filter(Boolean)

              // Create two columns for skills
              const skillsPerColumn = Math.ceil(skills.length / 2)
              const skillColumns = [skills.slice(0, skillsPerColumn), skills.slice(skillsPerColumn)]

              doc.fontSize(9)

              // First column of skills
              const startX = doc.x
              skillColumns[0].forEach((skill) => {
                doc.text(`• ${skill}`, { continued: false })
              })

              // Second column of skills if there are enough skills
              if (skillColumns[1].length > 0) {
                const currentY = doc.y
                doc.x = startX + leftColumnWidth / 2
                doc.y = leftColumnY + 20 // Adjust based on header height

                skillColumns[1].forEach((skill) => {
                  doc.text(`• ${skill}`, { continued: false })
                })

                // Set y to the maximum of both columns
                doc.y = Math.max(doc.y, currentY)
              }
            } else {
              // Regular content
              const content = lines.slice(1).join("\n").replace(/\*/g, "").trim()
              doc.text(content, { width: leftColumnWidth - 10 })
            }

            leftColumnY = doc.y + 15
          } else {
            // Position at right column
            doc.x = rightColumnX
            doc.y = rightColumnY

            // Draw section header with background
            doc
              .fillColor(primaryColor)
              .fontSize(14)
              .font(fontPath)
              .text(header, { underline: true })
              .moveDown(0.5)

            // Section content
            doc.fillColor("black").fontSize(10).font(fontPath)

            const content = lines.slice(1).join("\n").replace(/\*/g, "").trim()

            // Handle bullet points
            const bulletPoints = content
              .split(/•|\*/)
              .map((point) => point.trim())
              .filter(Boolean)

            if (bulletPoints.length > 1) {
              bulletPoints.forEach((point) => {
                doc.text(`• ${point}`, { width: rightColumnWidth - 10 }).moveDown(0.5)
              })
            } else {
              doc.text(content, { width: rightColumnWidth - 10 })
            }

            rightColumnY = doc.y + 15
          }
        } else {
          // This is content without a header, add to right column
          doc.x = rightColumnX
          doc.y = rightColumnY

          doc
            .fillColor("black")
            .fontSize(10)
            .font(fontPath)
            .text(section, { width: rightColumnWidth - 10 })

          rightColumnY = doc.y + 10
        }

        // Check if we need a new page
        const maxY = Math.max(leftColumnY, rightColumnY)
        if (maxY > doc.page.height - doc.page.margins.bottom) {
          doc.addPage()
          leftColumnY = doc.page.margins.top
          rightColumnY = doc.page.margins.top
        }
      }

      // Draw a separator line between columns
      doc
        .moveTo(doc.page.margins.left + leftColumnWidth + 5, currentY - 10)
        .lineTo(doc.page.margins.left + leftColumnWidth + 5, Math.max(leftColumnY, rightColumnY))
        .strokeColor(lightGray)
        .lineWidth(1)
        .stroke()

      // Finalize the PDF
      doc.end()
    } catch (error) {
      console.error("Error generating PDF:", error)
      reject(error)
    }
  })
}
