import OpenAI from "openai";

export const runtime = "edge";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
    "Content-Type": "application/json",
  });
}

const FEEDBACK_PROMPT = `
You are an interview evaluator AI.
Analyze the conversation and return ONLY valid JSON:

{
  "rating": {
    "technicalSkills": 0-5,
    "communication": 0-5,
    "problemSolving": 0-5,
    "experience": 0-5
  },
  "summery": "",
  "Recommendation": "",
  "RecommendationMsg": ""
}

Conversation:
{{conversation}}
`;

export async function POST(req) {
  try {
    const { conversation } = await req.json();

    const prompt = FEEDBACK_PROMPT.replace(
      "{{conversation}}",
      JSON.stringify(conversation)
    );

    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1"
     });
    
    const completion = await openai.chat.completions.create({
      model: "google/gemma-3n-e2b-it:free",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 600,
    });

    let content = completion.choices?.[0]?.message?.content ?? "";
    content = content.replace(/```json/gi, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("AI returned invalid JSON");
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: true, message: e.message }),
      { status: 500, headers: corsHeaders }
    );
  }
}
