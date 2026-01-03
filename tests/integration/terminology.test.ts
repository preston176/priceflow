import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Terminology Consistency', () => {
  const scanDirectory = (dir: string, extensions: string[]): string[] => {
    const files: string[] = []

    const scan = (currentDir: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name)

        // Skip node_modules, .next, and other non-source directories
        if (entry.isDirectory()) {
          if (!['node_modules', '.next', 'dist', '.git', 'coverage'].includes(entry.name)) {
            scan(fullPath)
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name)
          if (extensions.includes(ext)) {
            files.push(fullPath)
          }
        }
      }
    }

    scan(dir)
    return files
  }

  it('should not have "gifts" table references in cron jobs', () => {
    const cronDir = path.join(process.cwd(), 'app', 'api', 'cron')
    if (!fs.existsSync(cronDir)) return

    const files = scanDirectory(cronDir, ['.ts', '.tsx'])

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8')
      const relativePath = path.relative(process.cwd(), file)

      // Check for old table references
      expect(content, `${relativePath} should not reference "from gifts"`).not.toMatch(/from\(gifts\)/)
      expect(content, `${relativePath} should not import gifts from schema`).not.toMatch(/import.*{.*gifts.*}.*from.*schema/)
    })
  })

  it('should use "itemName" not "giftName" in email calls', () => {
    const cronDir = path.join(process.cwd(), 'app', 'api', 'cron')
    if (!fs.existsSync(cronDir)) return

    const files = scanDirectory(cronDir, ['.ts', '.tsx'])

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8')
      const relativePath = path.relative(process.cwd(), file)

      // Check for old parameter name in email calls
      if (content.includes('sendPriceAlertEmail')) {
        expect(content, `${relativePath} should use "itemName" not "giftName"`).not.toMatch(/giftName:/);
      }
    })
  })

  it('should have renamed component files', () => {
    const componentsDir = path.join(process.cwd(), 'components')
    if (!fs.existsSync(componentsDir)) return

    const files = scanDirectory(componentsDir, ['.tsx', '.ts'])
    const fileNames = files.map(f => path.basename(f))

    // Check that new file names exist (the important part)
    const hasItemCard = fileNames.some(f => f.includes('item-card'))
    const hasAddItemDialog = fileNames.some(f => f.includes('add-item-dialog'))
    const hasSharedItemCard = fileNames.some(f => f.includes('shared-item-card'))

    expect(hasItemCard || hasAddItemDialog || hasSharedItemCard,
      'Should have at least one renamed component file').toBe(true)
  })

  it('should have updated documentation to use "items" terminology', () => {
    const docsToCheck = [
      'README.md',
      'CRON-SETUP.md',
      'MARKETPLACE-IMPLEMENTATION.md',
      'NEXT_STEPS.md',
    ]

    docsToCheck.forEach(docFile => {
      const filePath = path.join(process.cwd(), docFile)
      if (!fs.existsSync(filePath)) return

      const content = fs.readFileSync(filePath, 'utf-8')

      // Documentation should use "items" or "item" terminology
      const hasItemsTerminology = content.match(/\b(items?|item management)\b/i)
      expect(hasItemsTerminology, `${docFile} should reference "items" or "item" terminology`).toBeTruthy()

      // Check that there are no "gifts table" references (old terminology)
      const giftTableMatches = content.match(/gifts table/gi) || []
      expect(giftTableMatches.length, `${docFile} should not reference "gifts table"`).toBe(0)
    })
  })

  it('should use generic list templates in constants', () => {
    const constantsPath = path.join(process.cwd(), 'lib', 'constants.ts')
    if (!fs.existsSync(constantsPath)) return

    const content = fs.readFileSync(constantsPath, 'utf-8')

    // Should have generic templates
    expect(content).toMatch(/Shopping List/i)
    expect(content).toMatch(/Wishlist/i)

    // Should not have holiday templates
    expect(content).not.toMatch(/Christmas List/i)
    expect(content).not.toMatch(/Birthday List/i)
  })
})
