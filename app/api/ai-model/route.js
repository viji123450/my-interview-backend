import OpenAI from "openai";

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

const QUESTION_PROMPT = `You are an expert technical interviewer.
Job Title: {{jobTitle}}
Job Description: {{jobDescription}}
Interview Duration: {{duration}}
Interview Type: {{type}}

Generate interviewQuestions=[
  {question:"", type:"Technical|Behavioral|Experience|Problem Solving|Leadership|Coding"}
]
Return only JSON object.`;

export async function POST(req) {
  try {
    const { jobPosition, jobDescription, duration, type } = await req.json();

    const prompt = QUESTION_PROMPT
      .replace("{{jobTitle}}", jobPosition)
      .replace("{{jobDescription}}", jobDescription)
      .replace("{{duration}}", duration)
      .replace("{{type}}", type);

    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://my-interview-backend.vercel.app",
        "X-Title": "AI Interview App",
      },
    });

    const completion = await openai.chat.completions.create({
      model: "mistralai/mistral-small-3.2-24b-instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 800,
    });
     
    let content = completion.choices?.[0]?.message?.content ?? "";
    content = content.replace(/```json/gi, "").replace(/```/g, "").trim();

    let data;
    try {
      data = JSON.parse(content);
    } catch {
      throw new Error("AI returned invalid JSON");
    }

    const questions = data.interviewQuestions || data;

    if (!Array.isArray(questions)) {
      throw new Error("Invalid interviewQuestions format");
    }

    return new Response(JSON.stringify(questions), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: true,
        message: "Failed to generate questions",
        details: err.message,
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
