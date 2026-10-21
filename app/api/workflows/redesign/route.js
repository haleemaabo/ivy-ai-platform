import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateTurnaroundReduction } from "@/lib/analytics";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request) {
  try {
    const body = await request.json();
    const { workflowId, steps, sprintId } = body;

    if (!workflowId || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: "Workflow ID and array of redesigned steps are required." },
        { status: 400 }
      );
    }

    // Calculate aggregated before/after hours
    const totalBaselineHours = steps.reduce((sum, step) => sum + (Number(step.beforeHours) || 0), 0);
    const totalTargetHours = steps.reduce((sum, step) => sum + (Number(step.afterHours) || 0), 0);
    const totalTurnaroundReductionPct = calculateTurnaroundReduction(totalBaselineHours, totalTargetHours);

    // 1. Update Workflow High-Level Metrics
    const { error: wfError } = await supabase
      .from("workflows")
      .update({
        sprint_id: sprintId || null,
        baseline_hours: totalBaselineHours,
        target_hours: totalTargetHours,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workflowId);

    if (wfError) {
      console.error("Error updating workflow summary:", wfError);
      return NextResponse.json({ error: wfError.message }, { status: 500 });
    }

    // 2. Upsert / Update Step Level Details
    for (const step of steps) {
      if (step.id) {
        const { error: stepError } = await supabase
          .from("workflow_steps")
          .upsert({
            id: step.id,
            workflow_id: workflowId,
            action_type: step.actionType, // ELIMINATE, SIMPLIFY, STANDARDIZE, AUTOMATE, AUGMENT
            human_ai_mode: step.humanAiMode, // AGENT_EXECUTES, AGENT_DRAFTS_HUMAN_OWNS, HUMAN_UNCHANGED, ELIMINATED
            before_hours: step.beforeHours || 0,
            after_hours: step.afterHours || 0,
            performer: step.performer,
            task: step.task,
            tools: step.tools || [],
          });

        if (stepError) {
          console.error(`Error updating step ${step.id}:`, stepError);
        }
      }
    }

    return NextResponse.json(
      {
        message: "Workflow redesign saved successfully.",
        workflowId,
        metrics: {
          totalBaselineHours,
          totalTargetHours,
          totalTurnaroundReductionPct,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("API error in /api/workflows/redesign:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}