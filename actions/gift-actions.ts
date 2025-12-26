"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { gifts, profiles, priceHistory } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { extractProductMetadata, extractMetadataFromScreenshot } from "@/lib/price-scraper";
import { sendPriceAlertEmail } from "@/lib/email";

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
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      const emailHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🚀 Price Update Started</h2>

          <p>Hi ${profile.name || "there"},</p>

          <p>We've started the automatic price update for:</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">${gift.name}</h3>
            <p style="margin: 0; color: #6b7280;">Target Price: $${parseFloat(gift.targetPrice).toFixed(2)}</p>
          </div>

          <p>We're checking prices across multiple marketplaces:</p>
          <ul style="color: #4b5563;">
            <li>🔧 Scraping current product pages</li>
            <li>🔍 Searching for best deals if needed</li>
            <li>💰 Finding the lowest prices available</li>
          </ul>

          <p><strong>We'll email you when the update is complete with:</strong></p>
          <ul style="color: #4b5563;">
            <li>Updated prices from all marketplaces</li>
            <li>Best deal recommendation</li>
            <li>Detailed results breakdown</li>
          </ul>

          <p style="margin-top: 30px;">
            <a href="${baseUrl}/dashboard"
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Dashboard
            </a>
          </p>

          <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">
            This usually takes 1-2 minutes. Sit back and relax! ☕
          </p>
        </div>
      `;

      await resend.emails.send({
        from: "GiftFlow <noreply@giftflow.app>",
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
