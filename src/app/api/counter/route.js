import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { broadcast } from "@/lib/sse";
import { startOfToday } from "@/lib/queue";

// GET /api/counter
// Returns all counters (with their currently-called queue) plus live stats.
export async function GET() {
  try {
    const [counters, waitingQueues, completedToday, skippedToday] = await Promise.all([
      prisma.counter.findMany({
        orderBy: { id: "asc" },
        include: {
          queues: {
            where: { status: "CALLING" },
            include: { serviceType: true },
            take: 1,
            orderBy: { calledAt: "desc" },
          },
        },
      }),
      prisma.queue.count({ where: { status: "WAITING" } }),
      prisma.queue.count({ where: { status: "COMPLETED", completedAt: { gte: startOfToday() } } }),
      prisma.queue.count({ where: { status: "SKIPPED", completedAt: { gte: startOfToday() } } }),
    ]);

    const formatted = counters.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      currentQueue: c.queues[0] || null,
    }));

    return NextResponse.json({
      ok: true,
      counters: formatted,
      stats: {
        totalWaiting: waitingQueues,
        servedToday: completedToday,
        skippedToday,
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// POST /api/counter
// Staff actions: CALL_NEXT, RECALL, SKIP, COMPLETE
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, counterId, queueId } = body;

    if (action === "CALL_NEXT") {
      const { serviceTypeId } = body;

      if (!counterId) {
        return NextResponse.json({ ok: false, error: "counterId is required" }, { status: 400 });
      }

      const active = await prisma.queue.findFirst({
        where: { counterId, status: "CALLING" },
      });
      if (active) {
        return NextResponse.json(
          { ok: false, error: "BUSY", message: "Please complete or skip the current ticket first." },
          { status: 409 }
        );
      }

      const waiting = await prisma.queue.findMany({
        where: { status: "WAITING", ...(serviceTypeId ? { serviceTypeId } : {}) },
        include: { serviceType: true },
      });

      if (waiting.length === 0) {
        return NextResponse.json(
          { ok: false, error: "EMPTY", message: "No customers waiting." },
          { status: 404 }
        );
      }

      waiting.sort((a, b) => {
        if (b.serviceType.priority !== a.serviceType.priority) {
          return b.serviceType.priority - a.serviceType.priority;
        }
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

      const next = waiting[0];

      const queue = await prisma.queue.update({
        where: { id: next.id },
        data: { status: "CALLING", counterId, calledAt: new Date() },
        include: { serviceType: true, counter: true },
      });

      broadcast("update", { type: "QUEUE_CALLED", queue });

      return NextResponse.json({ ok: true, queue });
    }

    if (action === "RECALL") {
      if (!queueId) {
        return NextResponse.json({ ok: false, error: "queueId is required" }, { status: 400 });
      }

      const queue = await prisma.queue.update({
        where: { id: queueId },
        data: { calledAt: new Date() },
        include: { serviceType: true, counter: true },
      });

      broadcast("update", { type: "QUEUE_CALLED", queue });

      return NextResponse.json({ ok: true, queue });
    }

    if (action === "SKIP") {
      if (!queueId) {
        return NextResponse.json({ ok: false, error: "queueId is required" }, { status: 400 });
      }

      const queue = await prisma.queue.update({
        where: { id: queueId },
        data: { status: "SKIPPED", completedAt: new Date() },
        include: { serviceType: true, counter: true },
      });

      broadcast("update", { type: "QUEUE_SKIPPED", queue });

      return NextResponse.json({ ok: true, queue });
    }

    if (action === "COMPLETE") {
      if (!queueId) {
        return NextResponse.json({ ok: false, error: "queueId is required" }, { status: 400 });
      }

      const queue = await prisma.queue.update({
        where: { id: queueId },
        data: { status: "COMPLETED", completedAt: new Date() },
        include: { serviceType: true, counter: true },
      });

      broadcast("update", { type: "QUEUE_COMPLETED", queue });

      return NextResponse.json({ ok: true, queue });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
