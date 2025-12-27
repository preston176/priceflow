import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface PriceAlertEmailData {
  to: string;
  userName: string;
  giftName: string;
  oldPrice: string;
  newPrice: string;
  savings: string;
  productUrl?: string;
}

export async function sendPriceAlertEmail(data: PriceAlertEmailData) {
  if (!resend) {
    console.warn("Resend not configured - skipping email");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { error } = await resend.emails.send({
      from: "PriceFlow <noreply@noreply.prestonmayieka.com>",
      to: data.to,
      subject: `Price Drop Alert: ${data.giftName} is now ${data.newPrice}!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #1e293b;
                background: #f8fafc;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 40px 30px;
                border-radius: 12px 12px 0 0;
                text-align: center;
              }
              .content {
                background: white;
                padding: 40px 30px;
                border-radius: 0 0 12px 12px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              }
              .price-box {
                background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
                border-left: 4px solid #10b981;
                padding: 25px;
                margin: 25px 0;
                border-radius: 10px;
              }
              .cta {
                background: #0d9488;
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 8px;
                display: inline-block;
                margin: 20px 0;
                font-weight: 600;
              }
              .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 30px;
                border-top: 1px solid #e2e8f0;
                color: #64748b;
                font-size: 13px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">🎉 Price Drop Alert!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.95; font-size: 15px;">Great news on your tracked item</p>
              </div>

              <div class="content">
                <p style="font-size: 15px; color: #475569;">Hi ${data.userName},</p>

                <p style="font-size: 15px; color: #475569;">
                  Great news! The price for <strong>${data.giftName}</strong> has dropped!
                </p>

                <div class="price-box">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="font-size: 14px; color: #475569;">Was:</span>
                    <span style="font-size: 20px; text-decoration: line-through; color: #94a3b8;">${data.oldPrice}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span style="font-size: 16px; color: #475569;">Now:</span>
                    <span style="font-size: 32px; font-weight: bold; color: #10b981;">${data.newPrice}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 2px solid #a7f3d0;">
                    <span style="font-size: 16px; color: #047857;">You Save:</span>
                    <span style="font-size: 28px; font-weight: bold; color: #059669;">${data.savings}</span>
                  </div>
                </div>

                ${
                  data.productUrl
                    ? `
                <div style="text-align: center; margin-top: 35px;">
                  <a href="${data.productUrl}" class="cta">View Product</a>
                </div>
                `
                    : ""
                }

                <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 15px; margin-top: 30px; text-align: center;">
                  <p style="margin: 0; color: #0f766e; font-size: 14px;">
                    💰 Don't wait - prices can change anytime!
                  </p>
                </div>

                <div class="footer">
                  <p style="margin: 0;"><strong>PriceFlow</strong> - Smart price tracking, zero effort</p>
                  <p style="margin: 15px 0 0 0; font-size: 12px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color: #0d9488; text-decoration: none;">Manage your wishlists</a>
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

interface DailySummaryEmailData {
  to: string;
  userName: string;
  priceDrops: Array<{
    giftName: string;
    oldPrice: string;
    newPrice: string;
    savings: string;
    url?: string;
  }>;
}

export async function sendDailySummaryEmail(data: DailySummaryEmailData) {
  if (!resend) {
    console.warn("Resend not configured - skipping email");
    return { success: false, error: "Email service not configured" };
  }

  if (data.priceDrops.length === 0) {
    return { success: true, message: "No price drops to report" };
  }

  try {
    const { error } = await resend.emails.send({
      from: "PriceFlow <noreply@noreply.prestonmayieka.com>",
      to: data.to,
      subject: `Daily Summary: ${data.priceDrops.length} price drop${data.priceDrops.length > 1 ? "s" : ""} on your wishlist`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #1e293b;
                background: #f8fafc;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
                color: white;
                padding: 40px 30px;
                border-radius: 12px 12px 0 0;
                text-align: center;
              }
              .content {
                background: white;
                padding: 40px 30px;
                border-radius: 0 0 12px 12px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              }
              .item-box {
                background: #f1f5f9;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 15px;
              }
              .cta {
                background: #0d9488;
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 8px;
                display: inline-block;
                margin: 20px 0;
                font-weight: 600;
              }
              .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 30px;
                border-top: 1px solid #e2e8f0;
                color: #64748b;
                font-size: 13px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">📊 Daily Price Summary</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.95; font-size: 15px;">Your wishlist updates for today</p>
              </div>

              <div class="content">
                <p style="font-size: 15px; color: #475569;">Hi ${data.userName},</p>

                <p style="font-size: 15px; color: #475569;">
                  We found <strong>${data.priceDrops.length} price drop${data.priceDrops.length > 1 ? "s" : ""}</strong> on your wishlist today:
                </p>

                ${data.priceDrops
                  .map(
                    (drop) => `
                <div class="item-box">
                  <h3 style="margin: 0 0 12px 0; font-size: 17px; color: #0f766e;">${drop.giftName}</h3>
                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div>
                      <span style="font-size: 14px; text-decoration: line-through; color: #94a3b8;">${drop.oldPrice}</span>
                      <span style="font-size: 20px; font-weight: bold; color: #10b981; margin-left: 10px;">${drop.newPrice}</span>
                    </div>
                    <span style="font-size: 16px; font-weight: 600; color: #059669;">Save ${drop.savings}</span>
                  </div>
                  ${
                    drop.url
                      ? `
                  <a href="${drop.url}" style="display: inline-block; margin-top: 12px; color: #0d9488; text-decoration: none; font-size: 14px; font-weight: 500;">View Product →</a>
                  `
                      : ""
                  }
                </div>
                `
                  )
                  .join("")}

                <div style="text-align: center; margin-top: 35px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta">View All Gifts</a>
                </div>

                <div class="footer">
                  <p style="margin: 0;"><strong>PriceFlow</strong> - Smart price tracking, zero effort</p>
                  <p style="margin: 15px 0 0 0; font-size: 12px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color: #0d9488; text-decoration: none;">Manage your wishlists</a>
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

interface WeeklyReminderEmailData {
  to: string;
  userName: string;
  itemsToCheck: number;
  giftsWithPrices: number;
  potentialSavings: number;
  bestDeal?: {
    name: string;
    savings: number;
  };
}

export async function sendWeeklyReminderEmail(data: WeeklyReminderEmailData) {
  if (!resend) {
    console.warn("Resend not configured - skipping email");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { error } = await resend.emails.send({
      from: "PriceFlow <noreply@noreply.prestonmayieka.com>",
      to: data.to,
      subject: `Weekly Reminder: ${data.itemsToCheck} items need price checks`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Weekly Price Check Reminder</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
            <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #10b981; margin: 0 0 20px 0; font-size: 24px;">📊 Weekly Price Check Reminder</h1>

              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.userName},</p>

              <p style="font-size: 16px; margin-bottom: 20px;">
                Just a friendly reminder to check prices on your wishlist items!
              </p>

              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
                <div style="margin-bottom: 10px;">
                  <span style="font-size: 14px; color: #6b7280;">Items waiting for price check:</span>
                  <span style="font-size: 24px; font-weight: bold; color: #10b981; margin-left: 10px;">${data.itemsToCheck}</span>
                </div>
                ${
                  data.potentialSavings > 0
                    ? `
                  <div style="margin-bottom: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                    <span style="font-size: 14px; color: #6b7280;">Current potential savings:</span>
                    <span style="font-size: 20px; font-weight: bold; color: #059669; margin-left: 10px;">$${data.potentialSavings.toFixed(2)}</span>
                  </div>
                  ${
                    data.bestDeal
                      ? `
                    <div style="padding-top: 10px; border-top: 1px solid #e5e7eb;">
                      <span style="font-size: 14px; color: #059669;">🏆 Best deal: ${data.bestDeal.name} ($${data.bestDeal.savings.toFixed(2)} off)</span>
                    </div>
                  `
                      : ""
                  }
                `
                    : ""
                }
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Check Prices Now
                </a>
              </div>

              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #065f46;">
                  <strong>Pro tip:</strong> Click "Update Price" on each gift card to manually enter the current price or upload a screenshot for AI-powered extraction!
                </p>
              </div>

              <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                This is a weekly reminder from PriceFlow. Keeping your prices updated helps you find the best deals and save money.
              </p>

              <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #9ca3af; margin: 5px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color: #10b981; text-decoration: none;">Manage your wishlists</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
