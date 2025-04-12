/**
 * Helper function to extract key sections from input text
 */
function extractSections(
  text: string,
  sections: string[],
  ultraCompact = false,
  aliasMap: Record<string, string> = {},
  maxChars: number = 3000
): string {
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim()
  let extractedContent = ""
  const foundSections = new Set<string>()

  // Generate combined regex for all section headers
  const sectionRegex = new RegExp(
    `\\b(${sections.join("|")})\\b\\s*:?\\s*([\\s\\S]*?)(?=\\b(${sections.join("|")})\\b|$)`,
    "gi"
  )

  const matches = [...cleaned.matchAll(sectionRegex)]

  for (const match of matches) {
    const originalHeader = match[1].toUpperCase()
    let header = aliasMap[originalHeader] || originalHeader

    if (foundSections.has(header)) continue
    foundSections.add(header)

    let sectionContent = match[2].trim()

    // Handle ultra compact logic
    if (ultraCompact) {
      sectionContent = sectionContent.substring(0, 200)

      if (header.includes("SKILL") || header.includes("QUALIFICATION") || header.includes("REQUIREMENT")) {
        const skillWords = sectionContent.match(/\b[A-Za-z0-9#+\-.]+(?:\s+[A-Za-z0-9#+\-.]+){0,2}\b/g) || []
        sectionContent = skillWords.join(", ")
      }
    }

    extractedContent += `${header}:\n${sectionContent}\n\n`
  }

  // If no structured sections found, fallback to raw truncated text
  if (!extractedContent.trim()) {
    extractedContent = ultraCompact ? cleaned.substring(0, 1000) : cleaned.substring(0, 2000)
  }

  return extractedContent.length > maxChars
    ? extractedContent.substring(0, maxChars) + "..."
    : extractedContent
}

// -------------------- RESUME PARSER ------------------------

export function parseResume(resumeText: string, ultraCompact = false): string {
  const sections = [
    "EDUCATION",
    "EXPERIENCE",
    "WORK EXPERIENCE",
    "SKILLS",
    "TECHNICAL SKILLS",
    "PROJECTS",
    "CERTIFICATIONS",
    "ACHIEVEMENTS",
    "SUMMARY",
    "OBJECTIVE",
  ]

  const aliasMap: Record<string, string> = {
    "WORK EXPERIENCE": "EXPERIENCE",
    "TECHNICAL SKILLS": "SKILLS",
  }

  const maxLength = ultraCompact ? 1500 : 3000
  return extractSections(resumeText, sections, ultraCompact, aliasMap, maxLength)
}

// -------------------- JOB DESCRIPTION PARSER ------------------------

export function parseJobDescription(jobDescription: string, ultraCompact = false): string {
  const sections = [
    "REQUIREMENTS",
    "QUALIFICATIONS",
    "RESPONSIBILITIES",
    "SKILLS",
    "REQUIRED SKILLS",
    "PREFERRED SKILLS",
    "ABOUT THE ROLE",
    "JOB DESCRIPTION",
  ]

  const aliasMap: Record<string, string> = {
    "REQUIRED SKILLS": "SKILLS",
    "PREFERRED SKILLS": "SKILLS",
  }

  const maxLength = ultraCompact ? 1000 : 2000
  return extractSections(jobDescription, sections, ultraCompact, aliasMap, maxLength)
}
