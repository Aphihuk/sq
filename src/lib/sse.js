// Lightweight in-memory pub/sub used to fan out queue updates to all
// connected SSE clients (TV display, staff dashboard, customer status).
//
// Stored on globalThis so the same Set is shared across route modules
// even when Next.js dev mode recompiles them as separate instances.

const globalForSse = globalThis;

const clients = globalForSse.__sseClients ?? (globalForSse.__sseClients = new Set());

const encoder = new TextEncoder();

export function addClient(controller) {
  clients.add(controller);
}

export function removeClient(controller) {
  clients.delete(controller);
}

export function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const chunk = encoder.encode(payload);

  for (const controller of clients) {
    try {
      controller.enqueue(chunk);
    } catch {
      clients.delete(controller);
    }
  }
}

export function clientCount() {
  return clients.size;
}
