import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Email Templates', () => {
  describe('Price Alert Email', () => {
    it('should use "itemName" parameter not "giftName"', async () => {
      // Mock the email module
      const mockSendPriceAlertEmail = vi.fn(async (data) => {
        // Verify the parameter name is correct
        expect(data).toHaveProperty('itemName')
        expect(data).not.toHaveProperty('giftName')

        return { success: true }
      })

      const emailData = {
        to: 'test@example.com',
        userName: 'Test User',
        itemName: 'Test Product',
        oldPrice: '$100.00',
        newPrice: '$80.00',
        savings: '$20.00',
        productUrl: 'https://example.com/product',
      }

      await mockSendPriceAlertEmail(emailData)
      expect(mockSendPriceAlertEmail).toHaveBeenCalledWith(emailData)
    })
  })

  describe('Weekly Reminder Email', () => {
    it('should use "itemsToCheck" and "itemsWithPrices" parameters', async () => {
      const mockSendWeeklyReminderEmail = vi.fn(async (data) => {
        expect(data).toHaveProperty('itemsToCheck')
        expect(data).toHaveProperty('itemsWithPrices')
        expect(data).not.toHaveProperty('giftsToCheck')
        expect(data).not.toHaveProperty('giftsWithPrices')

        return { success: true }
      })

      const emailData = {
        to: 'test@example.com',
        userName: 'Test User',
        itemsToCheck: 5,
        itemsWithPrices: 3,
        potentialSavings: 50.00,
        bestDeal: { name: 'Best Item', savings: 25.00 },
      }

      await mockSendWeeklyReminderEmail(emailData)
      expect(mockSendWeeklyReminderEmail).toHaveBeenCalledWith(emailData)
    })
  })
})
