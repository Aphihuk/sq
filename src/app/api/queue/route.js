import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { broadcast } from "@/lib/sse";
import { formatQueueNumber, todayStr, startOfToday } from "@/lib/queue";

// GET /api/queue
// Returns queues filtered by status (defaults to active WAITING/CALLING),
// plus available service types and settings.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    const where = statusParam
      ? { status: statusParam, createdAt: { gte: startOfToday() } }
      : { status: { in: ["WAITING", "CALLING"] } };

    const [queues, serviceTypes, settings] = await Promise.all([
      prisma.queue.findMany({
        where,
        include: { serviceType: true, counter: true },
        orderBy: statusParam ? { completedAt: "desc" } : { createdAt: "asc" },
      }),
      prisma.serviceType.findMany({ orderBy: { priority: "desc" } }),
      prisma.systemSettings.findUnique({ where: { id: "config" } }),
    ]);

    // Sort active queues by priority desc, then FIFO. Historical lists keep their order.
    const sorted = statusParam
      ? queues
      : [...queues].sort((a, b) => {
          if (a.status === "CALLING" && b.status !== "CALLING") return -1;
          if (b.status === "CALLING" && a.status !== "CALLING") return 1;
          if (b.serviceType.priority !== a.serviceType.priority) {
            return b.serviceType.priority - a.serviceType.priority;
          }
          return new Date(a.createdAt) - new Date(b.createdAt);
        });

    return NextResponse.json({ ok: true, queues: sorted, serviceTypes, settings });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// POST /api/queue
// Registers a new queue ticket.
export async function POST(request) {
  try {
    const body = await request.json();
    const { serviceTypeId, customerName, customerPhone, token } = body;

    if (!serviceTypeId) {
      return NextResponse.json({ ok: false, error: "serviceTypeId is required" }, { status: 400 });
    }

    const settings = await prisma.systemSettings.findUnique({ where: { id: "config" } });

    if (settings?.qrType === "DAILY") {
      const today = todayStr();
      if (!token || token !== settings.dailyToken || settings.tokenDate !== today) {
        return NextResponse.json(
          { ok: false, error: "INVALID_TOKEN", message: "QR code has expired. Please scan the QR code displayed today." },
          { status: 403 }
        );
      }
    }

    const serviceType = await prisma.serviceType.findUnique({ where: { id: serviceTypeId } });
    if (!serviceType) {
      return NextResponse.json({ ok: false, error: "Service type not found" }, { status: 404 });
    }

    const countToday = await prisma.queue.count({
      where: {
        serviceTypeId,
        createdAt: { gte: startOfToday() },
      },
    });

    const queueNumber = formatQueueNumber(serviceType.prefix, countToday + 1);

    const queue = await prisma.queue.create({
      data: {
        queueNumber,
        customerName: customerName?.trim() || "ລູກຄ້າ / Customer",
        customerPhone: customerPhone?.trim() || "-",
        serviceTypeId,
        status: "WAITING",
      },
      include: { serviceType: true, counter: true },
    });

    broadcast("update", { type: "QUEUE_NEW", queue });

    return NextResponse.json({ ok: true, queue });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
