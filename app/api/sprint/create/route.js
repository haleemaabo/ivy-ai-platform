import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request) {
  try {
    const body = await request.json();
    const { entityName, department, startDate, endDate, targetWorkflowsCount } = body;

    // Basic Validation
    if (!entityName || !department || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required sprint initialization fields." },
        { status: 400 }
      );
    }

    // Insert into sprints table
    const { data: sprint, error } = await supabase
      .from("sprints")
      .insert([
        {
          entity_name: entityName,
          department,
          start_date: startDate,
          end_date: endDate,
          target_workflows_count: targetWorkflowsCount || 0,
          status: "ACTIVE",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Database error creating sprint:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        message: "4-Week Sprint scope initialized successfully.",
        sprint,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("API error in /api/sprint/create:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}