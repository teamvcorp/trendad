import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/app/lib/mongodb";
import { CampaignDoc } from "@/app/lib/schema";
import { ObjectId } from "mongodb";

const MAX_CAMPAIGNS = 3;

// GET — list all campaigns
export async function GET() {
  try {
    const db = getDb();
    const campaigns = await db
      .collection<CampaignDoc>("campaigns")
      .find({})
      .sort({ updatedAt: -1 })
      .limit(MAX_CAMPAIGNS)
      .toArray();

    return NextResponse.json({
      campaigns: campaigns.map((c) => ({
        ...c,
        _id: c._id!.toString(),
      })),
    });
  } catch (err) {
    console.error("Failed to fetch campaigns:", err);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

// POST — save a new campaign (max 3)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();
    const col = db.collection<CampaignDoc>("campaigns");

    // Check count
    const count = await col.countDocuments();
    if (count >= MAX_CAMPAIGNS) {
      return NextResponse.json(
        {
          error: `Maximum ${MAX_CAMPAIGNS} campaigns allowed. Delete one first.`,
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const doc: CampaignDoc = {
      name: String(body.name || "Untitled Campaign").slice(0, 100),
      businessInfo: {
        serviceName: String(body.businessInfo?.serviceName || ""),
        description: String(body.businessInfo?.description || ""),
        prices: String(body.businessInfo?.prices || ""),
        contactInfo: String(body.businessInfo?.contactInfo || ""),
        signupUrl: String(body.businessInfo?.signupUrl || ""),
        productUrl: String(body.businessInfo?.productUrl || ""),
        imageUrl: body.businessInfo?.imageUrl || null,
      },
      selectedTrends: Array.isArray(body.selectedTrends)
        ? body.selectedTrends.slice(0, 5)
        : [],
      generatedAds: Array.isArray(body.generatedAds)
        ? body.generatedAds
        : [],
      publishStatus: {
        facebook: false,
        google: false,
        youtube: false,
      },
      createdAt: now,
      updatedAt: now,
    };

    const result = await col.insertOne(doc);

    return NextResponse.json({
      campaign: { ...doc, _id: result.insertedId.toString() },
    });
  } catch (err) {
    console.error("Failed to save campaign:", err);
    return NextResponse.json(
      { error: "Failed to save campaign" },
      { status: 500 }
    );
  }
}

// PUT — update existing campaign
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Campaign ID required" },
        { status: 400 }
      );
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json(
        { error: "Invalid campaign ID" },
        { status: 400 }
      );
    }

    const db = getDb();
    const col = db.collection<CampaignDoc>("campaigns");

    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    if (updates.name) updateFields.name = String(updates.name).slice(0, 100);
    if (updates.businessInfo) updateFields.businessInfo = updates.businessInfo;
    if (updates.selectedTrends) updateFields.selectedTrends = updates.selectedTrends;
    if (updates.generatedAds) updateFields.generatedAds = updates.generatedAds;
    if (updates.publishStatus) updateFields.publishStatus = updates.publishStatus;

    await col.updateOne({ _id: objectId }, { $set: updateFields });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to update campaign:", err);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

// DELETE — remove a campaign
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Campaign ID required" },
        { status: 400 }
      );
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json(
        { error: "Invalid campaign ID" },
        { status: 400 }
      );
    }

    const db = getDb();
    await db.collection("campaigns").deleteOne({ _id: objectId });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete campaign:", err);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
