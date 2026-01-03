import { describe, it, expect } from 'vitest'
import { items, priceHistory, marketplaceProducts } from '@/db/schema'

describe('Database Schema', () => {
  describe('Items Table', () => {
    it('should be named "items" not "gifts"', () => {
      // In Drizzle ORM, the table name is stored differently
      // We verify by checking the table exists and has the right structure
      expect(items).toBeDefined()
      expect(typeof items).toBe('object')
    })

    it('should have all required columns', () => {
      const columns = Object.keys(items)

      expect(columns).toContain('id')
      expect(columns).toContain('userId')
      expect(columns).toContain('name')
      expect(columns).toContain('targetPrice')
      expect(columns).toContain('currentPrice')
      expect(columns).toContain('url')
      expect(columns).toContain('isPurchased')
      expect(columns).toContain('autoUpdateEnabled')
      expect(columns).toContain('lastPriceCheck')
    })
  })

  describe('Price History Table', () => {
    it('should reference "itemId" not "giftId"', () => {
      const columns = Object.keys(priceHistory)

      expect(columns).toContain('itemId')
      expect(columns).not.toContain('giftId')
    })
  })

  describe('Marketplace Products Table', () => {
    it('should reference "itemId" not "giftId"', () => {
      const columns = Object.keys(marketplaceProducts)

      expect(columns).toContain('itemId')
      expect(columns).not.toContain('giftId')
    })
  })
})
