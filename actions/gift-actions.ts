"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { gifts, profiles, priceHistory } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { extractProductMetadata, extractMetadataFromScreenshot } from "@/lib/price-scraper";
import { sendPriceAlertEmail } from "@/lib/email";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface AddGiftInput {
  listId?: string;
  name: string;
  url?: string;
  imageUrl?: string;
  targetPrice: string;
  currentPrice?: string;
  recipientName: string;
  priority: "low" | "medium" | "high";
  notes?: string;
}

export async function addGift(input: AddGiftInput) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);

  if (!profile) {
    throw new Error("Profile not found. Please refresh the page.");
  }

  const [newGift] = await db
    .insert(gifts)
    .values({
      userId: profile.id,
      listId: input.listId || null,
      name: input.name,
      url: input.url || null,
      imageUrl: input.imageUrl || null,
      targetPrice: input.targetPrice,
      currentPrice: input.currentPrice || null,
      recipientName: input.recipientName,
      priority: input.priority,
      notes: input.notes || null,
      isPurchased: false,
    })
    .returning();

  revalidatePath("/dashboard");
  return newGift;
}

export async function getUserGifts(listId?: string) {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);

  if (!profile) {
    return [];
  }

  const userGifts = await db
    .select()
    .from(gifts)
    .where(
      listId
        ? and(eq(gifts.userId, profile.id), eq(gifts.listId, listId))
        : eq(gifts.userId, profile.id)
    )
    .orderBy(desc(gifts.createdAt));

  return userGifts;
}

export async function togglePurchased(giftId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);

  if (!profile) {
    throw new Error("Profile not found");
  }

  const [gift] = await db
    .select()
    .from(gifts)
    .where(and(eq(gifts.id, giftId), eq(gifts.userId, profile.id)))
    .limit(1);

  if (!gift) {
    throw new Error("Gift not found");
  }

  await db
    .update(gifts)
    .set({
      isPurchased: !gift.isPurchased,
      updatedAt: new Date(),
    })
    .where(eq(gifts.id, giftId));

  revalidatePath("/dashboard");
}

export async function updateGift(giftId: string, input: Partial<AddGiftInput>) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);

  if (!profile) {
    throw new Error("Profile not found");
  }

  const [gift] = await db
    .select()
    .from(gifts)
    .where(and(eq(gifts.id, giftId), eq(gifts.userId, profile.id)))
    .limit(1);

  if (!gift) {
    throw new Error("Gift not found");
  }

  await db
    .update(gifts)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(gifts.id, giftId));

  revalidatePath("/dashboard");
}

export async function deleteGift(giftId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);

  if (!profile) {
    throw new Error("Profile not found");
  }

  await db
    .delete(gifts)
    .where(and(eq(gifts.id, giftId), eq(gifts.userId, profile.id)));

  revalidatePath("/dashboard");
}

export async function updateGiftPrice(giftId: string, newPrice: number) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);

  if (!profile) {
    throw new Error("Profile not found");
  }

  const [gift] = await db
    .select()
    .from(gifts)
    .where(and(eq(gifts.id, giftId), eq(gifts.userId, profile.id)))
    .limit(1);

  if (!gift) {
    throw new Error("Gift not found");
  }

  const newPriceStr = newPrice.toString();
  const targetPrice = parseFloat(gift.targetPrice);

  // Calculate lowest and highest prices
  const currentLowest = gift.lowestPriceEver
    ? Math.min(parseFloat(gift.lowestPriceEver), newPrice)
    : newPrice;

  const currentHighest = gift.highestPriceEver
    ? Math.max(parseFloat(gift.highestPriceEver), newPrice)
    : newPrice;

  // Update gift with new price
  await db
    .update(gifts)
    .set({
      currentPrice: newPriceStr,
      lastPriceCheck: new Date(),
      lowestPriceEver: currentLowest.toString(),
      highestPriceEver: currentHighest.toString(),
      updatedAt: new Date(),
    })
    .where(eq(gifts.id, giftId));

  // Create price history record
  await db.insert(priceHistory).values({
    giftId,
    price: newPriceStr,
    source: "manual",
    checkedAt: new Date(),
  });

  // Send alert if price dropped below target
  const oldPrice = gift.currentPrice ? parseFloat(gift.currentPrice) : null;
  const isPriceDrop = newPrice < targetPrice;
  const wasAboveTarget = oldPrice ? oldPrice >= targetPrice : true;

  if (isPriceDrop && wasAboveTarget && profile.email) {
    // Price just dropped below target - send alert!
    await sendPriceAlertEmail({
      to: profile.email,
      userName: profile.name || "there",
      giftName: gift.name,
      oldPrice: oldPrice ? `$${oldPrice.toFixed(2)}` : `$${targetPrice.toFixed(2)}`,
      newPrice: `$${newPrice.toFixed(2)}`,
      savings: `$${(targetPrice - newPrice).toFixed(2)}`,
      productUrl: gift.url || undefined,
    });
  }

  revalidatePath("/dashboard");
}

/**
 * Extract product information from URL using AI
 * Returns product name, image, and price
 */
export async function fetchProductInfo(url: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const metadata = await extractProductMetadata(url);
    return metadata;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch product info",
    };
  }
}

/**
 * Extract product information from screenshot using Gemini Vision
 * Returns product name and price
 */
export async function analyzeProductScreenshot(imageBase64: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const metadata = await extractMetadataFromScreenshot(imageBase64);
    return metadata;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze screenshot",
    };
  }
}

/**
 * Toggle automatic price updates for a gift
 * When enabled, gift will be auto-updated periodically
 */
export async function toggleAutoUpdate(giftId: string, enabled: boolean) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Get user profile and gift details
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.clerkUserId, userId))
      .limit(1);

    const [gift] = await db
      .select()
      .from(gifts)
      .where(eq(gifts.id, giftId))
      .limit(1);

    if (!profile || !gift) {
      throw new Error("Profile or gift not found");
    }

    await db
      .update(gifts)
      .set({
        autoUpdateEnabled: enabled,
        updatedAt: new Date(),
      })
      .where(eq(gifts.id, giftId));

    // Send email when auto-update is toggled
    console.log(`[toggleAutoUpdate] Preparing to send email. Enabled: ${enabled}`);
    console.log(`[toggleAutoUpdate] Profile email: ${profile.email}`);
    console.log(`[toggleAutoUpdate] RESEND_API_KEY configured: ${!!process.env.RESEND_API_KEY}`);

    if (!profile.email) {
      console.error("[toggleAutoUpdate] No email address found for user");
      revalidatePath("/dashboard");
      return {
        success: true,
        enabled,
        message: "Auto-update toggled but no email sent (no email address)",
      };
    }

    if (enabled) {
      // Email when turning ON
      console.log(`[toggleAutoUpdate] Sending AUTO-UPDATE ON email to: ${profile.email}`);

      const emailHtml = `
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
              .feature {
                background: #f1f5f9;
                padding: 20px;
                margin: 20px 0;
                border-radius: 10px;
                border-left: 4px solid #0d9488;
              }
              .feature-title {
                font-weight: 600;
                color: #0d9488;
                margin-bottom: 8px;
                font-size: 16px;
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
              .gift-name {
                background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%);
                padding: 20px;
                border-radius: 10px;
                margin: 25px 0;
                font-size: 18px;
                font-weight: 600;
                text-align: center;
                color: #0f766e;
                border: 1px solid #99f6e4;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">⚡ Auto-Update Activated!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.95; font-size: 15px;">Your price tracking just got smarter</p>
              </div>

              <div class="content">
                <p style="font-size: 15px; color: #475569;">Hey there! 👋</p>

                <p style="font-size: 15px; color: #475569;">You just activated <strong>Auto-Update</strong> for:</p>

                <div class="gift-name">
                  ${gift.name}
                </div>

                <p style="font-size: 15px; color: #475569; margin-top: 25px;">Here's what happens next:</p>

                <div class="feature">
                  <div class="feature-title">🤖 Daily Price Checks</div>
                  <p style="margin: 5px 0 0 0; color: #475569;">Every day at 6 AM UTC, PriceFlow will automatically check prices across Amazon, Walmart, Target, and Best Buy.</p>
                </div>

                <div class="feature">
                  <div class="feature-title">📧 Email Updates</div>
                  <p style="margin: 5px 0 0 0; color: #475569;">When an update starts, you'll get a quick "Started" email. When it's done (1-2 minutes later), you'll get a detailed report with all the new prices.</p>
                </div>

                <div class="feature">
                  <div class="feature-title">💰 Best Price Alerts</div>
                  <p style="margin: 5px 0 0 0; color: #475569;">If we find a price below your target ($${gift.targetPrice}), we'll let you know immediately!</p>
                </div>

                <div class="feature">
                  <div class="feature-title">🔄 Smart Background Updates</div>
                  <p style="margin: 5px 0 0 0; color: #475569;">All updates happen in the background. You don't need to do anything - just check your email for deals!</p>
                </div>

                <h3 style="margin-top: 35px; color: #0f766e; font-size: 18px;">What to Expect</h3>
                <ul style="line-height: 1.8; color: #475569;">
                  <li><strong>Tomorrow at 6 AM UTC:</strong> Your first auto-update will run</li>
                  <li><strong>Daily:</strong> Same time every day, automatic checks</li>
                  <li><strong>No action needed:</strong> Sit back and let PriceFlow find deals for you</li>
                </ul>

                <h3 style="margin-top: 30px; color: #0f766e; font-size: 18px;">Need to Turn It Off?</h3>
                <p style="color: #475569;">No problem! Just head back to your dashboard and click the "Auto: ON" button to toggle it off anytime.</p>

                <div style="text-align: center; margin-top: 35px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta">View Dashboard</a>
                </div>

                <div class="footer">
                  <p style="margin: 0;"><strong>PriceFlow</strong> - Smart price tracking, zero effort</p>
                  <p style="margin: 15px 0 0 0; font-size: 12px;">
                    You're receiving this because you activated auto-update for ${gift.name}.<br>
                    Manage your settings in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color: #0d9488; text-decoration: none;">dashboard</a>.
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      try {
        const result = await resend.emails.send({
          from: "PriceFlow <noreply@noreply.prestonmayieka.com>",
          to: profile.email,
          subject: `⚡ Auto-Update Activated: ${gift.name}`,
          html: emailHtml,
        });
        console.log(`[toggleAutoUpdate] ✓ Email sent successfully:`, result);
      } catch (emailError) {
        console.error("[toggleAutoUpdate] ✗ Failed to send auto-update ON email:", emailError);
        // Log detailed error information
        if (emailError instanceof Error) {
          console.error("[toggleAutoUpdate] Error message:", emailError.message);
          console.error("[toggleAutoUpdate] Error stack:", emailError.stack);
        }
        // Don't throw - email failure shouldn't break the toggle
      }
    } else {
      // Email when turning OFF
      console.log(`[toggleAutoUpdate] Sending AUTO-UPDATE OFF email to: ${profile.email}`);

      const emailHtml = `
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
                background: linear-gradient(135deg, #64748b 0%, #475569 100%);
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
              .info-box {
                background: #f1f5f9;
                padding: 25px;
                margin: 25px 0;
                border-radius: 10px;
                border-left: 4px solid #64748b;
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
              .gift-name {
                background: #f1f5f9;
                padding: 20px;
                border-radius: 10px;
                margin: 25px 0;
                font-size: 18px;
                font-weight: 600;
                text-align: center;
                color: #334155;
                border: 1px solid #cbd5e1;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">⏸️ Auto-Update Paused</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.95; font-size: 15px;">You're back in manual control</p>
              </div>

              <div class="content">
                <p style="font-size: 15px; color: #475569;">Hey there! 👋</p>

                <p style="font-size: 15px; color: #475569;">You've turned off <strong>Auto-Update</strong> for:</p>

                <div class="gift-name">
                  ${gift.name}
                </div>

                <div class="info-box">
                  <h3 style="margin: 0 0 15px 0; color: #334155; font-size: 17px;">What This Means</h3>
                  <ul style="color: #475569; line-height: 1.8; margin: 10px 0;">
                    <li><strong>No more daily checks:</strong> We won't automatically check prices for this item</li>
                    <li><strong>No price alerts:</strong> You won't receive emails when prices change</li>
                    <li><strong>Manual updates only:</strong> You can still manually update prices anytime</li>
                  </ul>
                </div>

                <h3 style="margin-top: 30px; color: #0f766e; font-size: 18px;">Want to Track Prices Again?</h3>
                <p style="color: #475569;">No problem! You can turn Auto-Update back on anytime from your dashboard. Just click the "Auto: OFF" button to re-enable automatic price tracking.</p>

                <h3 style="margin-top: 30px; color: #0f766e; font-size: 18px;">Other Ways to Track Prices:</h3>
                <ul style="color: #475569; line-height: 1.8;">
                  <li><strong>Manual Sync:</strong> Click "Sync Prices" in the marketplace section</li>
                  <li><strong>Update Price:</strong> Use the "Update Price" button to manually enter new prices</li>
                  <li><strong>Price History:</strong> View historical price trends anytime</li>
                </ul>

                <div style="text-align: center; margin-top: 35px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta">Go to Dashboard</a>
                </div>

                <div class="footer">
                  <p style="margin: 0;"><strong>PriceFlow</strong> - Your prices, your way</p>
                  <p style="margin: 15px 0 0 0; font-size: 12px;">
                    You're receiving this because you paused auto-update for ${gift.name}.<br>
                    Manage your settings in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color: #0d9488; text-decoration: none;">dashboard</a>.
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      try {
        const result = await resend.emails.send({
          from: "PriceFlow <noreply@noreply.prestonmayieka.com>",
          to: profile.email,
          subject: `⏸️ Auto-Update Paused: ${gift.name}`,
          html: emailHtml,
        });
        console.log(`[toggleAutoUpdate] ✓ Email sent successfully:`, result);
      } catch (emailError) {
        console.error("[toggleAutoUpdate] ✗ Failed to send auto-update OFF email:", emailError);
        // Log detailed error information
        if (emailError instanceof Error) {
          console.error("[toggleAutoUpdate] Error message:", emailError.message);
          console.error("[toggleAutoUpdate] Error stack:", emailError.stack);
        }
        // Don't throw - email failure shouldn't break the toggle
      }
    }

    revalidatePath("/dashboard");

    return {
      success: true,
      enabled,
    };
  } catch (error) {
    console.error("Failed to toggle auto update:", error);
    throw error;
  }
}

/**
 * Trigger automatic background price update
 * Uses QStash to run scraping + SerpAPI fallback in background
 * Sends email when complete
 */
export async function autoUpdatePrice(giftId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!baseUrl) {
      throw new Error("App URL not configured");
    }

    if (!process.env.QSTASH_TOKEN) {
      throw new Error("QStash not configured");
    }

    // Get user profile and gift details
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.clerkUserId, userId))
      .limit(1);

    if (!profile) {
      throw new Error("Profile not found");
    }

    const [gift] = await db
      .select()
      .from(gifts)
      .where(eq(gifts.id, giftId))
      .limit(1);

    if (!gift) {
      throw new Error("Gift not found");
    }

    // Call QStash directly from server action
    const { Client } = await import("@upstash/qstash");
    const qstash = new Client({
      token: process.env.QSTASH_TOKEN,
    });

    const result = await qstash.publishJSON({
      url: `${baseUrl}/api/workers/update-price`,
      body: {
        giftId,
        userId,
      },
    });

    // Send initial email notification
    if (profile.email) {
      const emailHtml = `
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
              .gift-box {
                background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%);
                padding: 25px;
                border-radius: 10px;
                margin: 25px 0;
                border: 1px solid #99f6e4;
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
                <h1 style="margin: 0; font-size: 28px;">🚀 Price Update Started</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.95; font-size: 15px;">Checking prices across marketplaces</p>
              </div>

              <div class="content">
                <p style="font-size: 15px; color: #475569;">Hi ${profile.name || "there"},</p>

                <p style="font-size: 15px; color: #475569;">We've started the automatic price update for:</p>

                <div class="gift-box">
                  <h3 style="margin: 0 0 10px 0; color: #0f766e; font-size: 18px;">${gift.name}</h3>
                  <p style="margin: 0; color: #0891b2; font-weight: 600;">Target Price: $${parseFloat(gift.targetPrice).toFixed(2)}</p>
                </div>

                <h3 style="color: #0f766e; font-size: 17px; margin-top: 30px;">We're checking prices across multiple marketplaces:</h3>
                <ul style="color: #475569; line-height: 1.8;">
                  <li>🛒 Amazon</li>
                  <li>🛒 Walmart</li>
                  <li>🛒 Target</li>
                  <li>🛒 Best Buy</li>
                </ul>

                <h3 style="color: #0f766e; font-size: 17px; margin-top: 30px;">You'll receive a completion email with:</h3>
                <ul style="color: #475569; line-height: 1.8;">
                  <li>✓ Updated prices from all marketplaces</li>
                  <li>✓ Best deal recommendation</li>
                  <li>✓ Detailed results breakdown</li>
                </ul>

                <div style="text-align: center; margin-top: 35px;">
                  <a href="${baseUrl}/dashboard" class="cta">View Dashboard</a>
                </div>

                <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 15px; margin-top: 30px; text-align: center;">
                  <p style="margin: 0; color: #0f766e; font-size: 14px;">
                    ⏱️ This usually takes 1-2 minutes. Sit back and relax!
                  </p>
                </div>

                <div class="footer">
                  <p style="margin: 0;"><strong>PriceFlow</strong> - Smart price tracking, zero effort</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      await resend.emails.send({
        from: "PriceFlow <noreply@noreply.prestonmayieka.com>",
        to: profile.email,
        subject: `Price Update Started: ${gift.name}`,
        html: emailHtml,
      });
    }

    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Price update started! Check your email for confirmation.",
      jobId: result.messageId,
    };
  } catch (error) {
    console.error("Failed to start auto update:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to start auto update",
    };
  }
}
