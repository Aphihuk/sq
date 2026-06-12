import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { estimateWaitMinutes } from "@/lib/queue";

// GET /api/queue/[id]
// Returns a single queue ticket with its live position in line.
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const queue = await prisma.queue.findUnique({
      where: { id },
      include: { serviceType: true, counter: true },
    });

    if (!queue) {
      return NextResponse.json({ ok: false, error: "Queue not found" }, { status: 404 });
    }

    let positionAhead = 0;

    if (queue.status === "WAITING") {
      const waiting = await prisma.queue.findMany({
        where: { status: "WAITING" },
        include: { serviceType: true },
      });

      positionAhead = waiting.filter((q) => {
        if (q.id === queue.id) return false;
        if (q.serviceType.priority !== queue.serviceType.priority) {
          return q.serviceType.priority > queue.serviceType.priority;
        }
        return new Date(q.createdAt) < new Date(queue.createdAt);
      }).length;
    }

    return NextResponse.json({
      ok: true,
      queue,
      positionAhead,
      estimatedWaitMinutes: estimateWaitMinutes(positionAhead),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
