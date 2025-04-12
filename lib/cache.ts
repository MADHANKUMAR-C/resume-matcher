type CacheItem = {
  value: any
  timestamp: number
}

type CacheStore = {
  [key: string]: {
    [type: string]: CacheItem
  }
}

class AnalysisCache {
  private store: CacheStore = {}
  private ttl = 3600000 // 1 hour in milliseconds

  set(key: string, type: string, value: any, customTtl?: number) {
    if (!this.store[key]) {
      this.store[key] = {}
    }

    this.store[key][type] = {
      value,
      timestamp: Date.now(),
    }

    // Set expiration
    const ttl = customTtl || this.ttl
    setTimeout(() => {
      if (this.store[key] && this.store[key][type]) {
        delete this.store[key][type]

        // Clean up empty keys
        if (Object.keys(this.store[key]).length === 0) {
          delete this.store[key]
        }
      }
    }, ttl)
  }

  get(key: string, type: string): any | null {
    if (!this.store[key] || !this.store[key][type]) {
      return null
    }

    const item = this.store[key][type]
    const now = Date.now()

    // Check if item is expired
    if (now - item.timestamp > this.ttl) {
      delete this.store[key][type]

      // Clean up empty keys
      if (Object.keys(this.store[key]).length === 0) {
        delete this.store[key]
      }

      return null
    }

    return item.value
  }

  clear() {
    this.store = {}
  }
}

export const analysisCache = new AnalysisCache()
