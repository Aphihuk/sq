import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { todayStr, startOfToday } from "@/lib/queue";

// GET /api/admin
// Returns settings, service types, counters and analytics for the admin panel.
export async function GET() {
  try {
    const [settings, serviceTypes, counters, todaysQueues] = await Promise.all([
      prisma.systemSettings.findUnique({ where: { id: "config" } }),
      prisma.serviceType.findMany({ orderBy: { priority: "desc" } }),
      prisma.counter.findMany({ orderBy: { id: "asc" } }),
      prisma.queue.findMany({
        where: { createdAt: { gte: startOfToday() } },
        include: { serviceType: true },
      }),
    ]);

    const statusBreakdown = { WAITING: 0, CALLING: 0, COMPLETED: 0, SKIPPED: 0 };
    const serviceTypeBreakdown = {};
    const hourlyVolume = Array.from({ length: 24 }, () => 0);

    let waitTotal = 0;
    let waitCount = 0;
    let serviceTotal = 0;
    let serviceCount = 0;

    for (const q of todaysQueues) {
      statusBreakdown[q.status] = (statusBreakdown[q.status] || 0) + 1;

      const stName = q.serviceType?.name || "Unknown";
      serviceTypeBreakdown[stName] = (serviceTypeBreakdown[stName] || 0) + 1;

      hourlyVolume[new Date(q.createdAt).getHours()] += 1;

      if (q.calledAt) {
        waitTotal += new Date(q.calledAt) - new Date(q.createdAt);
        waitCount += 1;
      }
      if (q.completedAt && q.calledAt && q.status === "COMPLETED") {
        serviceTotal += new Date(q.completedAt) - new Date(q.calledAt);
        serviceCount += 1;
      }
    }

    const analytics = {
      total: todaysQueues.length,
      statusBreakdown,
      serviceTypeBreakdown,
      hourlyVolume,
      avgWaitMinutes: waitCount ? Math.round(waitTotal / waitCount / 60000) : 0,
      avgServiceMinutes: serviceCount ? Math.round(serviceTotal / serviceCount / 60000) : 0,
    };

    return NextResponse.json({ ok: true, settings, serviceTypes, counters, analytics });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin
// Admin configuration actions.
export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "SET_QR_TYPE": {
        const { qrType } = body;
        if (!["STATIC", "DAILY"].includes(qrType)) {
          return NextResponse.json({ ok: false, error: "Invalid qrType" }, { status: 400 });
        }
        const settings = await prisma.systemSettings.upsert({
          where: { id: "config" },
          update: { qrType, ...(qrType === "DAILY" ? { tokenDate: todayStr() } : {}) },
          create: {
            id: "config",
            qrType,
            dailyToken: crypto.randomBytes(8).toString("hex"),
            tokenDate: todayStr(),
          },
        });
        return NextResponse.json({ ok: true, settings });
      }

      case "REGENERATE_TOKEN": {
        const settings = await prisma.systemSettings.upsert({
          where: { id: "config" },
          update: { dailyToken: crypto.randomBytes(8).toString("hex"), tokenDate: todayStr() },
          create: {
            id: "config",
            qrType: "DAILY",
            dailyToken: crypto.randomBytes(8).toString("hex"),
            tokenDate: todayStr(),
          },
        });
        return NextResponse.json({ ok: true, settings });
      }

      case "CREATE_SERVICE_TYPE": {
        const { name, prefix, priority } = body;
        if (!name || !prefix) {
          return NextResponse.json({ ok: false, error: "name and prefix are required" }, { status: 400 });
        }
        const serviceType = await prisma.serviceType.create({
          data: { name, prefix: prefix.toUpperCase(), priority: Number(priority) || 1 },
        });
        return NextResponse.json({ ok: true, serviceType });
      }

      case "UPDATE_SERVICE_TYPE": {
        const { id, name, prefix, priority } = body;
        if (!id) {
          return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
        }
        const serviceType = await prisma.serviceType.update({
          where: { id },
          data: {
            ...(name !== undefined ? { name } : {}),
            ...(prefix !== undefined ? { prefix: prefix.toUpperCase() } : {}),
            ...(priority !== undefined ? { priority: Number(priority) } : {}),
          },
        });
        return NextResponse.json({ ok: true, serviceType });
      }

      case "DELETE_SERVICE_TYPE": {
        const { id } = body;
        if (!id) {
          return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
        }
        await prisma.serviceType.delete({ where: { id } });
        return NextResponse.json({ ok: true });
      }

      case "TOGGLE_COUNTER": {
        const { id } = body;
        if (!id) {
          return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
        }
        const counter = await prisma.counter.findUnique({ where: { id } });
        if (!counter) {
          return NextResponse.json({ ok: false, error: "Counter not found" }, { status: 404 });
        }
        const updated = await prisma.counter.update({
          where: { id },
          data: { status: counter.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
        });
        return NextResponse.json({ ok: true, counter: updated });
      }

      case "CREATE_COUNTER": {
        const { id, name } = body;
        if (!id || !name) {
          return NextResponse.json({ ok: false, error: "id and name are required" }, { status: 400 });
        }
        const counter = await prisma.counter.create({ data: { id, name, status: "ACTIVE" } });
        return NextResponse.json({ ok: true, counter });
      }

      default:
        return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
