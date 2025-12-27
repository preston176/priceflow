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
      from: "PriceFlow <noreply@noreply.prestonmayieka.com>",
      to: email,
      subject: `${senderName} shared a gift list with you on PriceFlow`,
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
              .list-box {
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
              .link-box {
                background: #f1f5f9;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                text-align: center;
                word-break: break-all;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">🎁 You've Been Invited!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.95; font-size: 15px;">Someone shared a gift list with you</p>
              </div>

              <div class="content">
                <p style="font-size: 15px; color: #475569;">
                  <strong>${senderName}</strong> has shared their gift list with you on PriceFlow.
                </p>

                <div class="list-box">
                  <h2 style="margin: 0 0 10px 0; color: #0f766e; font-size: 22px;">${listName}</h2>
                  ${listDesc ? `<p style="margin: 0; color: #0891b2; font-size: 14px;">${listDesc}</p>` : ""}
                </div>

                <div style="text-align: center; margin: 35px 0;">
                  <a href="${shareUrl}" class="cta">View Gift List</a>
                </div>

                <div class="link-box">
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">Or copy and paste this link:</p>
                  <code style="font-size: 13px; color: #0f766e;">${shareUrl}</code>
                </div>

                <div class="footer">
                  <p style="margin: 0;"><strong>PriceFlow</strong> - Smart price tracking, zero effort</p>
                  <p style="margin: 15px 0 0 0; font-size: 12px;">
                    This invitation was sent from PriceFlow. If you didn't expect this email, you can safely ignore it.
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to share list by email:", error);
    return { success: false, error: "Failed to send invitation" };
  }
}
