import { describe, it, expect } from 'vitest'
import { LIST_TEMPLATES } from '@/lib/constants'

describe('List Templates', () => {
  it('should have generic templates instead of holiday-focused ones', () => {
    const templateNames = LIST_TEMPLATES.map(t => t.name)

    // Check that generic templates exist
    expect(templateNames).toContain('Shopping List')
    expect(templateNames).toContain('Wishlist')
    expect(templateNames).toContain('Home Essentials')
    expect(templateNames).toContain('Electronics')

    // Check that old holiday templates don't exist
    expect(templateNames).not.toContain('Christmas')
    expect(templateNames).not.toContain('Birthday')
    expect(templateNames).not.toContain('Anniversary')
  })

  it('should have 6 template options', () => {
    expect(LIST_TEMPLATES).toHaveLength(6)
  })

  it('should have descriptions for all templates', () => {
    LIST_TEMPLATES.forEach(template => {
      expect(template.description).toBeTruthy()
      expect(template.description.length).toBeGreaterThan(0)
    })
  })
})
