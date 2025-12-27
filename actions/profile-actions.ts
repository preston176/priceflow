"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function ensureProfile() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      throw new Error("Unauthorized");
    }

    // Check for existing profile
    const [existingProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.clerkUserId, userId))
      .limit(1);

    if (existingProfile) {
      return existingProfile;
    }

    // Get email from primary email address
    const primaryEmail = user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId
    )?.emailAddress || user.emailAddresses[0]?.emailAddress;

    if (!primaryEmail) {
      console.error("No email address found for user:", userId);
      throw new Error("No email address found");
    }

    // Create new profile
    const [newProfile] = await db
      .insert(profiles)
      .values({
        clerkUserId: userId,
        email: primaryEmail,
        name: user.fullName || user.firstName || user.username || "User",
        imageUrl: user.imageUrl || null,
      })
      .returning();

    return newProfile;
  } catch (error) {
    console.error("Error in ensureProfile:", error);
    throw error;
  }
}

export async function updateBudget(listId: string, budget: string) {
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

  // Import lists table
  const { lists } = await import("@/db/schema");

  // Update the list's budget
  await db
    .update(lists)
    .set({
      budget: budget,
      updatedAt: new Date(),
    })
    .where(eq(lists.id, listId));

  revalidatePath("/dashboard");
}
