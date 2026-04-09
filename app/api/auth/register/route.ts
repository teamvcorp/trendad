import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { getDb } from "@/app/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = (await request.json()) as {
      name: string;
      email: string;
      password: string;
    };

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const existing = await db.collection("users").findOne({
      email: email.toLowerCase().trim(),
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    const result = await db.collection("users").insertOne({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      // Social media tokens — saved from profile
      socialTokens: {
        facebook: { accessToken: "", pageId: "" },
        youtube: { accessToken: "" },
        google: { note: "Manual posting only" },
      },
      // Business info — persisted across sessions
      savedBusinessInfo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      userId: result.insertedId.toString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
