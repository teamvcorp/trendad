import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getDb } from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";

// GET — load user profile (tokens + saved business info)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as { id?: string }).id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const db = await getDb();
  const user = await db.collection("users").findOne(
    { _id: new ObjectId((session.user as { id: string }).id) },
    { projection: { passwordHash: 0 } }
  );

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    name: user.name,
    email: user.email,
    socialTokens: user.socialTokens || {
      facebook: { accessToken: "", pageId: "" },
      youtube: { accessToken: "" },
      google: { note: "Manual posting only" },
    },
    savedBusinessInfo: user.savedBusinessInfo || null,
  });
}

// PUT — update user profile (tokens and/or business info)
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as { id?: string }).id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const db = await getDb();
  const userId = new ObjectId((session.user as { id: string }).id);

  const update: Record<string, unknown> = { updatedAt: new Date() };

  if (body.socialTokens) {
    // Only save the fields provided
    if (body.socialTokens.facebook) {
      update["socialTokens.facebook"] = {
        accessToken: String(body.socialTokens.facebook.accessToken || ""),
        pageId: String(body.socialTokens.facebook.pageId || ""),
      };
    }
    if (body.socialTokens.youtube) {
      update["socialTokens.youtube"] = {
        accessToken: String(body.socialTokens.youtube.accessToken || ""),
      };
    }
  }

  if (body.savedBusinessInfo !== undefined) {
    update["savedBusinessInfo"] = body.savedBusinessInfo;
  }

  await db.collection("users").updateOne(
    { _id: userId },
    { $set: update }
  );

  return NextResponse.json({ success: true });
}
