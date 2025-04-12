"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Briefcase,
  Building2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileDown,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

type MatchResult = {
  matchPercentage: number
  matchedSkills: string[]
  missingSkills: string[]
  suggestions: string[]
  explanation: string
  companies: CompanyRecommendation[]
  jobs: JobRecommendation[]
  modelUsed?: string
  error?: string
  rawResponse?: string
  parsingError?: boolean
}

type CompanyRecommendation = {
  name: string
  reason: string
  industry: string
}

type JobRecommendation = {
  title: string
  reason: string
  existingSkills: string[]
  skillsToAcquire: string[]
}

export function ResumeMatcher() {
  const [jobDescription, setJobDescription] = useState("")
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<MatchResult | null>(null)
  const [processingTime, setProcessingTime] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState("match")
  const [isAlterSectionOpen, setIsAlterSectionOpen] = useState(false)
  const [alteredResume, setAlteredResume] = useState<string | null>(null)
  const [isGeneratingAltered, setIsGeneratingAltered] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit. Please upload a smaller file.")
        setResumeFile(null)
        return
      }

      if (
        file.type === "application/pdf" ||
        file.name.endsWith(".pdf") ||
        file.type === "text/plain" ||
        file.name.endsWith(".txt") ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".docx")
      ) {
        setResumeFile(file)
        setError(null)
      } else {
        setError("Please upload a PDF, TXT, or DOCX file")
        setResumeFile(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!resumeFile) {
      setError("Please upload a resume file")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setProcessingTime(null)

    const startTime = Date.now()

    try {
      const formData = new FormData()
      formData.append("resume", resumeFile)

      if (jobDescription.trim()) {
        formData.append("jobDescription", jobDescription)
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 1200000) // 20 minute timeout

      const response = await fetch("/api/match-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const endTime = Date.now()
      setProcessingTime(endTime - startTime)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server responded with ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setResult(data)

      // If no job description was provided, switch to companies tab
      if (!jobDescription.trim()) {
        setActiveTab("companies")
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setError(
          "Request timed out. Try with a shorter resume or job description, or check if Ollama is running properly.",
        )
      } else {
        setError(err.message || "Failed to analyze resume")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateAltered = async () => {
    if (!resumeFile || !jobDescription.trim()) {
      setError("Resume file and job description are required to generate an optimized resume")
      return
    }

    setIsGeneratingAltered(true)
    setAlteredResume(null)

    try {
      const formData = new FormData()
      formData.append("resume", resumeFile)
      formData.append("jobDescription", jobDescription)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 600000) // 10 minute timeout

      const response = await fetch("/api/alter-resume", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server responded with ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setAlteredResume(data.alteredResume)
    } catch (err: any) {
      if (err.name === "AbortError") {
        setError("Resume alteration timed out. Try again with a shorter resume or job description.")
      } else {
        setError(err.message || "Failed to generate altered resume")
      }
      console.error("Error generating altered resume:", err)
    } finally {
      setIsGeneratingAltered(false)
    }
  }

  const handleDownloadAltered = async () => {
    if (!alteredResume) {
      setError("No altered resume available to download")
      return
    }

    setIsDownloading(true)

    try {
      // Set a loading state if needed
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resumeText: alteredResume }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.status}`)
      }

      // Create a blob from the PDF data
      const blob = await response.blob()

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "optimized-resume.pdf"
      document.body.appendChild(a)
      a.click()

      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      setError(err.message || "Failed to download altered resume")
      console.error("Error downloading altered resume:", err)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resume Matcher</CardTitle>
          <CardDescription>
            Upload your resume to get job matches, company recommendations, and career insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Resume</label>
              <div
                className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.txt,.docx"
                />
                {resumeFile ? (
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-500" />
                    <span className="font-medium">{resumeFile.name}</span>
                    <span className="text-xs text-muted-foreground">({(resumeFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">PDF, TXT, or DOCX (max 5MB)</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Job Description <span className="text-xs text-muted-foreground">(Optional)</span>
              </label>
              <Textarea
                placeholder="Paste a job description to see how well your resume matches..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground text-right">{jobDescription.length} characters</p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} disabled={isLoading || !resumeFile} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Resume...
              </>
            ) : (
              "Analyze Resume"
            )}
          </Button>
        </CardFooter>
      </Card>

      {isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis in Progress</CardTitle>
            <CardDescription>Please wait while we analyze your resume</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Processing</h3>
              </div>
              <Progress value={undefined} className="h-2" />
            </div>

            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <>
          {result.parsingError && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Partial Results</AlertTitle>
              <AlertDescription className="flex flex-col gap-2">
                <p>
                  We encountered some issues processing the full response. Some results may be incomplete or missing.
                </p>
                <Button variant="outline" size="sm" className="self-start" onClick={handleSubmit}>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Try Again
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="match" disabled={!jobDescription.trim()}>
                Job Match
              </TabsTrigger>
              <TabsTrigger value="companies">Companies</TabsTrigger>
              <TabsTrigger value="jobs">Job Roles</TabsTrigger>
            </TabsList>

            <TabsContent value="match">
              {jobDescription.trim() ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Job Match Analysis</span>
                      {result.modelUsed && (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800"
                        >
                          <Zap className="h-3 w-3" />
                          {result.modelUsed}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Here's how your resume matches the job description
                      {processingTime && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (Processed in {(processingTime / 1000).toFixed(1)} seconds)
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">Match Percentage</h3>
                        <span className="text-lg font-bold">{result.matchPercentage}%</span>
                      </div>
                      <Progress value={result.matchPercentage} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Matched Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {result.matchedSkills.map((skill, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            {skill}
                          </Badge>
                        ))}
                        {result.matchedSkills.length === 0 && (
                          <p className="text-sm text-muted-foreground">No matched skills found</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Missing Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {result.missingSkills.map((skill, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800"
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            {skill}
                          </Badge>
                        ))}
                        {result.missingSkills.length === 0 && (
                          <p className="text-sm text-muted-foreground">No missing skills found</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Suggestions to Improve</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {result.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm">
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Explanation</h3>
                      <p className="text-sm whitespace-pre-wrap">{result.explanation}</p>
                    </div>
                  </CardContent>
                  {jobDescription.trim() && (
                    <Collapsible
                      open={isAlterSectionOpen}
                      onOpenChange={setIsAlterSectionOpen}
                      className="border rounded-lg p-2 mt-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Resume Optimization</h3>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {isAlterSectionOpen ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="mt-2 space-y-4">
  <p className="text-sm">
    Would you like to see an altered resume optimized for this job description?
  </p>
  <div className="flex gap-2">
    <Button variant="outline" size="sm" onClick={() => setIsAlterSectionOpen(false)}>
      No
    </Button>
    {!alteredResume && (
      <Button size="sm" onClick={handleGenerateAltered} disabled={isGeneratingAltered}>
        {isGeneratingAltered ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          "Yes"
        )}
      </Button>
    )}
  </div>

  {alteredResume && (
    <div className="mt-4 p-4 bg-muted rounded-md">
      <p className="text-sm font-medium mb-2">Preview of Optimized Resume:</p>
      <div className="max-h-[200px] overflow-y-auto text-sm">
        {alteredResume.split("\n\n").map((paragraph, i) => (
          <p key={i} className="mb-2">
            {paragraph}
          </p>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        The optimized resume highlights your relevant skills and experience for this specific job description.
      </p>
    </div>
  )}
</CollapsibleContent>

                    </Collapsible>
                  )}
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-10">
                    <div className="text-center">
                      <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">No Job Description Provided</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Add a job description to see how well your resume matches specific job requirements
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="companies">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Company Recommendations</span>
                    {result.modelUsed && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800"
                      >
                        <Zap className="h-3 w-3" />
                        {result.modelUsed}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Companies that align with your skills and experience</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.companies.map((company, index) => (
                      <div key={index} className="flex gap-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{company.name}</h3>
                          <p className="text-sm text-muted-foreground">{company.reason}</p>
                          <Badge variant="outline" className="mt-2">
                            {company.industry}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="jobs">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Job Recommendations</span>
                    {result.modelUsed && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800"
                      >
                        <Zap className="h-3 w-3" />
                        {result.modelUsed}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Growing job roles that match your skills and experience</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.jobs.map((job, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-primary" />
                          <h3 className="font-medium">{job.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{job.reason}</p>
                        <div>
                          <h4 className="text-xs font-medium uppercase text-muted-foreground mb-1">
                            Your Matching Skills
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {job.existingSkills.map((skill, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800"
                              >
                                <CheckCircle className="mr-1 h-3 w-3" />
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium uppercase text-muted-foreground mb-1">
                            Skills to Develop
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {job.skillsToAcquire.map((skill, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-800"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
