import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayStr } from "@/lib/queue";

const SERVICE_TYPES = [
  { name: "ບໍລິການທົ່ວໄປ / General Service", prefix: "A", priority: 1 },
  { name: "ຊຳລະເງິນ / Bill Payment", prefix: "C", priority: 1 },
  { name: "ບໍລິການພິເສດ VIP / VIP Service", prefix: "B", priority: 3 },
];

const COUNTERS = [
  { id: "1", name: "Counter 1" },
  { id: "2", name: "Counter 2" },
  { id: "3", name: "Counter 3" },
];

const USERS = [
  { username: "admin", password: "admin123", role: "ADMIN" },
  { username: "staff1", password: "staff123", role: "STAFF" },
];

export async function GET() {
  try {
    const [serviceTypes, counters, users, settings, queues] = await Promise.all([
      prisma.serviceType.count(),
      prisma.counter.count(),
      prisma.user.count(),
      prisma.systemSettings.findUnique({ where: { id: "config" } }),
      prisma.queue.count(),
    ]);

    const seeded = serviceTypes > 0 && counters > 0 && users > 0 && !!settings;

    return NextResponse.json({
      ok: true,
      seeded,
      counts: { serviceTypes, counters, users, queues },
      settings,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, seeded: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    await Promise.all(
      SERVICE_TYPES.map((st) =>
        prisma.serviceType.upsert({
          where: { prefix: st.prefix },
          update: { name: st.name, priority: st.priority },
          create: st,
        })
      )
    );

    await Promise.all(
      COUNTERS.map((c) =>
        prisma.counter.upsert({
          where: { id: c.id },
          update: { name: c.name },
          create: { ...c, status: "ACTIVE" },
        })
      )
    );

    await Promise.all(
      USERS.map((u) =>
        prisma.user.upsert({
          where: { username: u.username },
          update: { password: u.password, role: u.role },
          create: u,
        })
      )
    );

    await prisma.systemSettings.upsert({
      where: { id: "config" },
      update: {},
      create: {
        id: "config",
        qrType: "STATIC",
        dailyToken: "static-secret-key",
        tokenDate: todayStr(),
      },
    });

    const [serviceTypes, counters, users, settings] = await Promise.all([
      prisma.serviceType.count(),
      prisma.counter.count(),
      prisma.user.count(),
      prisma.systemSettings.findUnique({ where: { id: "config" } }),
    ]);

    return NextResponse.json({
      ok: true,
      seeded: true,
      counts: { serviceTypes, counters, users },
      settings,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await prisma.queue.deleteMany();
    return NextResponse.json({ ok: true, message: "All queue tickets cleared." });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
