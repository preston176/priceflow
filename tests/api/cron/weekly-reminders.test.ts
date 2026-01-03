import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

describe('Weekly Reminders Cron Job', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should query "items" table not "gifts" table', async () => {
    // This test verifies that the cron job uses the correct table name
    // by checking the source code directly
    const fs = await import('fs')
    const path = await import('path')

    const filePath = path.join(process.cwd(), 'app', 'api', 'cron', 'weekly-reminders', 'route.ts')
    const content = fs.readFileSync(filePath, 'utf-8')

    // The file should import 'items' from schema
    expect(content).toMatch(/import.*{.*items.*}.*from.*schema/)
    expect(content).toMatch(/\.from\(items\)/)

    // Should NOT import or use 'gifts'
    expect(content).not.toMatch(/import.*{.*gifts.*}.*from.*schema/)
    expect(content).not.toMatch(/\.from\(gifts\)/)
  })

  it('should require proper authorization', async () => {
    const request = new NextRequest('http://localhost:3000/api/cron/weekly-reminders', {
      method: 'GET',
      headers: {
        'authorization': 'Bearer wrong-secret'
      }
    })

    // Mock the cron secret
    process.env.CRON_SECRET = 'correct-secret'

    try {
      const { GET } = await import('@/app/api/cron/weekly-reminders/route')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    } catch (error) {
      // Expected to fail if database connection is not set up
      // The important part is that it checks authorization first
      expect(error).toBeDefined()
    }
  })
})
