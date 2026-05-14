// lib/github.ts
// Fetches GitHub contribution data via public API (no auth needed for public profiles)

export interface ContributionDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface ContributionData {
  total: number
  weeks: ContributionDay[][]
}

// Uses jogruber's GitHub contributions API — returns structured JSON, no auth
export async function fetchContributions(username: string): Promise<ContributionData> {
  try {
    const res = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${username}?y=last`,
      { next: { revalidate: 3600 } } // cache for 1 hour
    )
    if (!res.ok) throw new Error('API error')
    const data = await res.json()

    // API returns { total: { [year]: n }, contributions: [{ date, count, level }] }
    const contributions: ContributionDay[] = data.contributions ?? []
    const total = Object.values(data.total as Record<string, number>).reduce((a, b) => a + b, 0)

    // Group into weeks (7-day chunks)
    const weeks: ContributionDay[][] = []
    for (let i = 0; i < contributions.length; i += 7) {
      weeks.push(contributions.slice(i, i + 7))
    }

    return { total, weeks: weeks.slice(-52) } // last 52 weeks
  } catch {
    // Return empty data on failure — module still renders
    return { total: 0, weeks: [] }
  }
}
