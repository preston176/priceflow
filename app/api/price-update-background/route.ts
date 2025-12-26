import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Client } from "@upstash/qstash";

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { giftId } = await request.json();

    if (!giftId) {
      return NextResponse.json({ error: "Gift ID required" }, { status: 400 });
    }

    // Get the base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin");

    // Trigger background worker via QStash
    const result = await qstash.publishJSON({
      url: `${baseUrl}/api/workers/update-price`,
      body: {
        giftId,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Price update started in background. You'll receive an email when complete.",
      jobId: result.messageId,
    });
  } catch (error) {
    console.error("Failed to start background price update:", error);
    return NextResponse.json(
      { error: "Failed to start price update" },
      { status: 500 }
    );
  }
}
