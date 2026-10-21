import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request) {
  try {
    const body = await request.json();
    const { workflowId, reviewerId, accuracy, completeness, actionability, compliance } = body;

    if (!workflowId || accuracy === undefined || completeness === undefined || actionability === undefined || compliance === undefined) {
      return NextResponse.json(
        { error: "Missing workflow ID or incomplete 4-dimension scoring parameters." },
        { status: 400 }
      );
    }

    // Dynamic Calculation of Composite Score
    const numAccuracy = Number(accuracy);
    const numCompleteness = Number(completeness);
    const numActionability = Number(actionability);
    const numCompliance = Number(compliance);

    const averageScore = Number(
      ((numAccuracy + numCompleteness + numActionability + numCompliance) / 4).toFixed(2)
    );

    // Enforce Quality Gate Rule (Threshold >= 3.5)
    const clearedGate = averageScore >= 3.5;

    // 1. Insert Record Into quality_reviews Table
    const { data: reviewRecord, error: reviewError } = await supabase
      .from("quality_reviews")
      .insert([
        {
          workflow_id: workflowId,
          reviewer_id: reviewerId || null,
          accuracy: numAccuracy,
          completeness: numCompleteness,
          actionability: numActionability,
          compliance: numCompliance,
          is_blind: true,
          cleared_gate: clearedGate,
        },
      ])
      .select()
      .single();

    if (reviewError) {
      console.error("Error inserting quality review:", reviewError);
      return NextResponse.json({ error: reviewError.message }, { status: 500 });
    }

    // 2. Sync / Update quality_score on the workflow
    await supabase
      .from("workflows")
      .update({ quality: averageScore })
      .eq("id", workflowId);

    return NextResponse.json(
      {
        message: "Blind quality assessment submitted successfully.",
        review: reviewRecord,
        summary: {
          averageScore,
          clearedGate,
          capacityUnlocked: clearedGate,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("API error in /api/quality/review:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}