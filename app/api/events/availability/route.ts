import { NextRequest } from "next/server";
import { realtimeEventBus, SSEEventEnvelope } from "@/lib/services/event-bus";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get("venueId") || "venue-1";
  const date = searchParams.get("date") || "2026-09-18";

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial connected handshake
      const initialMessage = `data: ${JSON.stringify({
        type: "connected",
        venueId,
        date,
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initialMessage));

      // 2. Subscribe to realtime inventory events
      const listener = (event: SSEEventEnvelope) => {
        try {
          const message = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch {
          // Controller might be closed
        }
      };

      const unsubscribe = realtimeEventBus.subscribe(venueId, date, listener);

      // 3. Heartbeat keepalive every 15 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      // 4. Cleanup when client disconnects
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
