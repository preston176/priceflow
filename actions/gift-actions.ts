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

    const response = await fetch(`${baseUrl}/api/price-update-background`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ giftId }),
    });

    if (!response.ok) {
      throw new Error("Failed to start background price update");
    }

    const data = await response.json();
    revalidatePath("/dashboard");

    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to start auto update",
    };
  }
}
