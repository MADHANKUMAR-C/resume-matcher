// Simple in-memory cache for resume analysis results
type CacheEntry = {
    result: any
    timestamp: number
  }
  
  class AnalysisCache {
    private cache: Map<string, CacheEntry> = new Map()
    private readonly TTL = 1000 * 60 * 60 * 24 // 24 hours cache TTL
  
    // Generate a cache key from resume text and job description
    private generateKey(resumeText: string, jobDescription: string): string {
      // Simple hashing function for strings
      const hash = (str: string) => {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i)
          hash = (hash << 5) - hash + char
          hash = hash & hash // Convert to 32bit integer
        }
        return hash.toString(16)
      }
  
      return `${hash(resumeText)}_${hash(jobDescription)}`
    }
  
    // Get cached result if available
    get(resumeText: string, jobDescription: string): any | null {
      const key = this.generateKey(resumeText, jobDescription)
      const entry = this.cache.get(key)
  
      if (!entry) return null
  
      // Check if entry has expired
      if (Date.now() - entry.timestamp > this.TTL) {
        this.cache.delete(key)
        return null
      }
  
      return entry.result
    }
  
    // Store result in cache
    set(resumeText: string, jobDescription: string, result: any): void {
      const key = this.generateKey(resumeText, jobDescription)
      this.cache.set(key, {
        result,
        timestamp: Date.now(),
      })
  
      // Clean up old entries if cache gets too large
      if (this.cache.size > 100) {
        this.cleanupOldEntries()
      }
    }
  
    // Remove old entries
    private cleanupOldEntries(): void {
      const now = Date.now()
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > this.TTL) {
          this.cache.delete(key)
        }
      }
    }
  }
  
  // Export a singleton instance
  export const analysisCache = new AnalysisCache()
  