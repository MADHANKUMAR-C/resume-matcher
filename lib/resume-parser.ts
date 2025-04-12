/**
 * Parse resume text
 */
export function parseResume(resumeText: string, shouldSanitize: boolean): string {
  if (!resumeText) return ""

  try {
    let parsedText = resumeText.trim()

    if (shouldSanitize) {
      // Remove excessive whitespace
      parsedText = parsedText.replace(/[\r\n]+/g, "\n").replace(/^\s*\n/gm, "")

      // Limit length to prevent token limits
      if (parsedText.length > 5000) {
        parsedText = parsedText.substring(0, 5000) + "... [truncated]"
      }
    }

    return parsedText
  } catch (error) {
    console.error("Error parsing resume:", error)
    return resumeText || ""
  }
}

/**
 * Parse job description text
 */
export function parseJobDescription(jobDescription: string, shouldSanitize: boolean): string {
  if (!jobDescription) return ""

  try {
    let parsedText = jobDescription.trim()

    if (shouldSanitize) {
      // Remove excessive whitespace
      parsedText = parsedText.replace(/[\r\n]+/g, "\n").replace(/^\s*\n/gm, "")

      // Limit length to prevent token limits
      if (parsedText.length > 2000) {
        parsedText = parsedText.substring(0, 2000) + "... [truncated]"
      }
    }

    return parsedText
  } catch (error) {
    console.error("Error parsing job description:", error)
    return jobDescription || ""
  }
}
