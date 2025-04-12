export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

export function isValidFileType(file: File): boolean {
  const validTypes = [
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]

  // Check by MIME type if available
  if (validTypes.includes(file.type)) {
    return true
  }

  // Fallback to extension check
  const fileName = file.name.toLowerCase()
  return fileName.endsWith(".pdf") || fileName.endsWith(".txt") || fileName.endsWith(".docx")
}

export function getFileExtension(fileName: string): string {
  return fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2)
}
