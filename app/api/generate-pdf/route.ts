import { type NextRequest, NextResponse } from "next/server"
import puppeteer from "puppeteer"

export async function POST(req: NextRequest) {
  try {
    const { resumeText } = await req.json()

    if (!resumeText) {
      return NextResponse.json({ error: "Resume text is required" }, { status: 400 })
    }

    // Launch a headless browser
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()

    // Create a simple HTML template for the resume
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Optimized Resume</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 40px;
            max-width: 800px;
          }
          h1, h2, h3 {
            color: #333;
          }
          .section {
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <h1>Optimized Resume</h1>
        <div class="content">
          ${resumeText.replace(/\n/g, "<br>")}
        </div>
      </body>
      </html>
    `

    // Set the HTML content
    await page.setContent(htmlContent)

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    })

    // Close the browser
    await browser.close()

    // Return the PDF as a response
    return new NextResponse(pdfBuffer, {
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

