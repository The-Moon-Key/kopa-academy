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

    const { message, conversation_id, project_id, layer_id } = await req.json();

    // Load active assistant prompt
    const { data: promptVersion } = await supabase
      .from("ai_prompt_versions")
      .select("*")
      .eq("persona", "assistant")
      .eq("is_active", true)
      .single();

    // Load or create conversation
    let convId = conversation_id;
    if (!convId) {
      const { data: conv } = await supabase
        .from("assistant_conversations")
        .insert({
          apprentice_id: user.id,
          project_id,
          layer_id,
        })
        .select()
        .single();
      convId = conv?.id;
    }

    // Load conversation history
    const { data: history } = await supabase
      .from("assistant_messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("sequence", { ascending: true });

    // Store user message
    const sequence = (history?.length || 0) + 1;
    await supabase.from("assistant_messages").insert({
      conversation_id: convId,
      role: "user",
      content: message,
      sequence,
    });

    // TODO: Call Claude API
    // const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")!;
    // const response = await fetch("https://api.anthropic.com/v1/messages", { ... });

    const assistantResponse =
      "I'm the KOPA AI Assistant. This is a placeholder response — the Claude API integration will be configured with your API key. I'm here to guide you through your learning journey without giving direct answers.";

    // Store assistant message
    await supabase.from("assistant_messages").insert({
      conversation_id: convId,
      role: "assistant",
      content: assistantResponse,
      sequence: sequence + 1,
    });

    return new Response(
      JSON.stringify({
        conversation_id: convId,
        message: assistantResponse,
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
