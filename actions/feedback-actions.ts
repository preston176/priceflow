"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { feedbacks } from "@/db/schema";

export async function submitFeedback(data: {
  type: string;
  message: string;
}) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error("Unauthorized");
  }

  // Get user email
  const userEmail =
    user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId
    )?.emailAddress || user.emailAddresses[0]?.emailAddress;

  // Store feedback in database
  await db.insert(feedbacks).values({
    userId,
    email: userEmail || "unknown",
    name: user.fullName || user.firstName || user.username || "User",
    feedbackType: data.type,
    message: data.message,
  });

  return { success: true };
}
