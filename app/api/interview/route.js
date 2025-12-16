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
  });
}

export async function POST(req) {
  try {
    const interviewData = await req.json();

    console.log("📥 Saving interview", interviewData?.interviewId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Interview saved",
        interviewId: interviewData?.interviewId,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, message: e.message }),
      { status: 500, headers: corsHeaders }
    );
  }
}
