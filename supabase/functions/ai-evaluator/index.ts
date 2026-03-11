import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, session_id, question_id } = await req.json();

    // Load active evaluator prompt
    const { data: promptVersion } = await supabase
      .from("ai_prompt_versions")
      .select("*")
      .eq("persona", "evaluator")
      .eq("is_active", true)
      .single();

    // Load question details
    const { data: question } = await supabase
      .from("knowledge_check_questions")
      .select("*, question_competencies(competency_id, tier, competencies(name))")
      .eq("id", question_id)
      .single();

    // Load or create session
    let sessId = session_id;
    if (!sessId) {
      // Mark previous sessions as not current
      await supabase
        .from("knowledge_check_sessions")
        .update({ is_current: false })
        .eq("apprentice_id", user.id)
        .eq("question_id", question_id);

      // Get next attempt number
      const { count } = await supabase
        .from("knowledge_check_sessions")
        .select("*", { count: "exact", head: true })
        .eq("apprentice_id", user.id)
        .eq("question_id", question_id);

      const { data: session } = await supabase
        .from("knowledge_check_sessions")
        .insert({
          apprentice_id: user.id,
          question_id,
          attempt_number: (count || 0) + 1,
          is_current: true,
          result_source: "ai",
          model_version: promptVersion?.model_version || "claude-sonnet-4-20250514",
          prompt_version_id: promptVersion?.id,
        })
        .select()
        .single();
      sessId = session?.id;
    }

    // Load session messages
    const { data: history } = await supabase
      .from("knowledge_check_messages")
      .select("role, content")
      .eq("session_id", sessId)
      .order("sequence", { ascending: true });

    // Store user message
    const sequence = (history?.length || 0) + 1;
    await supabase.from("knowledge_check_messages").insert({
      session_id: sessId,
      role: "user",
      content: message,
      sequence,
    });

    // TODO: Call Claude API for evaluation
    // const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")!;
    // Build evaluation prompt with question context, competency requirements, conversation history
    // Parse structured response for result determination

    const assistantResponse =
      "Thank you for your response. This is a placeholder — the Claude API evaluator will be configured to assess your understanding of the relevant competencies. It will provide detailed feedback and determine your result (pass/developing/not_yet).";

    // Store assistant message
    await supabase.from("knowledge_check_messages").insert({
      session_id: sessId,
      role: "assistant",
      content: assistantResponse,
      sequence: sequence + 1,
    });

    // In production, the evaluator would determine and set the result:
    // await supabase.from("knowledge_check_sessions")
    //   .update({ result: "pass", completed_at: new Date().toISOString() })
    //   .eq("id", sessId);

    return new Response(
      JSON.stringify({
        session_id: sessId,
        message: assistantResponse,
        result: null, // Will be set by actual evaluator
        prompt_version_id: promptVersion?.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
