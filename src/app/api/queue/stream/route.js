import { addClient, removeClient } from "@/lib/sse";

export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

// GET /api/queue/stream
// Server-Sent Events endpoint broadcasting real-time queue updates.
export async function GET() {
  let heartbeat;
  let controllerRef;

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
      addClient(controller);

      controller.enqueue(encoder.encode("retry: 2000\n\n"));
      controller.enqueue(encoder.encode(`event: connected\ndata: {"ok":true}\n\n`));

      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25000);
    },
    cancel() {
      clearInterval(heartbeat);
      if (controllerRef) removeClient(controllerRef);
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
