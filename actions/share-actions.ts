"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { shareTokens, lists, profiles, gifts, listCollaborators } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateShareToken } from "@/lib/utils";
import { Resend } from "resend";

export async function getOrCreateShareToken(listId: string) {
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

  // Verify list ownership
  const [list] = await db
    .select()
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, profile.id)))
    .limit(1);

  if (!list) {
    throw new Error("List not found");
  }

  const [existingToken] = await db
    .select()
    .from(shareTokens)
    .where(and(eq(shareTokens.listId, listId), eq(shareTokens.isActive, true)))
    .orderBy(desc(shareTokens.createdAt))
    .limit(1);

  if (existingToken) {
    return existingToken.token;
  }

  const token = generateShareToken();

  await db.insert(shareTokens).values({
    listId,
    token,
    isActive: true,
  });

  return token;
}

export async function regenerateShareToken(listId: string) {
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

  // Verify list ownership
  const [list] = await db
    .select()
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, profile.id)))
    .limit(1);

  if (!list) {
    throw new Error("List not found");
  }

  await db
    .update(shareTokens)
    .set({ isActive: false })
    .where(eq(shareTokens.listId, listId));

  const token = generateShareToken();

  await db.insert(shareTokens).values({
    listId,
    token,
    isActive: true,
  });

  return token;
}

export async function getSharedWishlist(token: string) {
  const [shareToken] = await db
    .select()
    .from(shareTokens)
    .where(and(eq(shareTokens.token, token), eq(shareTokens.isActive, true)))
    .limit(1);

  if (!shareToken) {
    return null;
  }

  const [list] = await db
    .select()
    .from(lists)
    .where(eq(lists.id, shareToken.listId))
    .limit(1);

  if (!list || list.isArchived) {
    return null;
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, list.userId))
    .limit(1);

  if (!profile) {
    return null;
  }

  const wishlistGifts = await db
    .select()
    .from(gifts)
    .where(and(eq(gifts.listId, list.id), eq(gifts.isPurchased, false)))
    .orderBy(desc(gifts.priority), desc(gifts.createdAt));

  return {
    list: {
      name: list.name,
      description: list.description,
    },
    profile: {
      name: profile.name,
      imageUrl: profile.imageUrl,
    },
    gifts: wishlistGifts,
  };
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function shareListByEmail(listId: string, email: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.clerkUserId, userId))
      .limit(1);

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    // Verify list ownership
    const [list] = await db
      .select()
      .from(lists)
      .where(and(eq(lists.id, listId), eq(lists.userId, profile.id)))
      .limit(1);

    if (!list) {
      return { success: false, error: "List not found" };
    }

    // Check if already shared with this email
    const [existing] = await db
      .select()
      .from(listCollaborators)
      .where(and(eq(listCollaborators.listId, listId), eq(listCollaborators.email, email)))
      .limit(1);

    if (existing) {
      return { success: false, error: "List already shared with this email" };
    }

    // Create collaborator entry
    await db.insert(listCollaborators).values({
      listId,
      email,
      invitedBy: profile.id,
    });

    // Generate share link
    const token = await getOrCreateShareToken(listId);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const shareUrl = `${appUrl}/share/${token}`;

    // Send email notification
    const senderName = profile.name || "Someone";
    const listName = list.name;
    const listDesc = list.description || "";

    await resend.emails.send({
      from: "Zawadi <noreply@zawadi.app>",
      to: email,
      subject: `${senderName} shared a gift list with you on Zawadi`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">You've been invited to view a gift list!</h1>
          <p style="font-size: 16px; color: #666;">
            <strong>${senderName}</strong> has shared their gift list
            "<strong>${listName}</strong>" with you on Zawadi.
          </p>
          ${listDesc ? `<p style="font-size: 14px; color: #888;">${listDesc}</p>` : ""}
          <a href="${shareUrl}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            View Gift List
          </a>
          <p style="font-size: 14px; color: #888; margin-top: 20px;">
            Or copy and paste this link into your browser:<br/>
            <code style="background: #f4f4f4; padding: 4px 8px; border-radius: 3px;">${shareUrl}</code>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;"/>
          <p style="font-size: 12px; color: #999;">
            This invitation was sent from Zawadi. If you did not expect this email, you can safely ignore it.
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to share list by email:", error);
    return { success: false, error: "Failed to send invitation" };
  }
}
