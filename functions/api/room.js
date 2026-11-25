
export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  if (!env.OTHELLO_ROOMS) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Durable Object binding is not configured"
      }),
      {
        status: 503,
        headers: corsHeaders
      }
    );
  }

  if (request.method === "GET") {
    return new Response(
      JSON.stringify({
        success: true,
        message: "Othello room API is ready"
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed"
      }),
      {
        status: 405,
        headers: corsHeaders
      }
    );
  }

  try {
    const body = await request.json();

    const roomCode = String(body.roomCode || "").toUpperCase();

    if (!/^[0-9]{6}[A-Z]$/.test(roomCode)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid room code"
        }),
        {
          status: 400,
          headers: corsHeaders
        }
      );
    }

    const id = env.OTHELLO_ROOMS.idFromName(roomCode);
    const room = env.OTHELLO_ROOMS.get(id);

    const response = await room.fetch(
      new Request("https://room.internal/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      })
    );

    return new Response(response.body, {
      status: response.status,
      headers: corsHeaders
    });

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Room request failed"
      }),
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
}
