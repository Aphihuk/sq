"use client";

import { useCallback, useEffect, useState } from "react";
import { Volume2, VolumeX, Tv, Users } from "lucide-react";
import styles from "./page.module.css";
import { playChime, speak, spellQueueNumber, unlockAudio } from "@/lib/audio";

export default function TvDisplayPage() {
  const [counters, setCounters] = useState([]);
  const [waiting, setWaiting] = useState([]);
  const [now, setNow] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [overlay, setOverlay] = useState(null);
  const [flash, setFlash] = useState(false);

  const refresh = useCallback(async () => {
    const [counterRes, queueRes] = await Promise.all([
      fetch("/api/counter").then((r) => r.json()),
      fetch("/api/queue").then((r) => r.json()),
    ]);
    if (counterRes.ok) setCounters(counterRes.counters);
    if (queueRes.ok) setWaiting(queueRes.queues.filter((q) => q.status === "WAITING"));
  }, []);

  useEffect(() => {
    refresh();
    const tick = () => setNow(new Date());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  const announce = useCallback(
    (queue) => {
      setOverlay(queue);
      setFlash(true);

      if (soundEnabled) {
        playChime();
        setTimeout(() => {
          speak(`Queue ${spellQueueNumber(queue.queueNumber)}, please proceed to ${queue.counter?.name || "the counter"}`);
        }, 700);
      }

      setTimeout(() => setOverlay(null), 7000);
      setTimeout(() => setFlash(false), 4000);
    },
    [soundEnabled]
  );

  useEffect(() => {
    const source = new EventSource("/api/queue/stream");
    source.addEventListener("update", (e) => {
      const payload = JSON.parse(e.data);
      refresh();
      if (payload.type === "QUEUE_CALLED") {
        announce(payload.queue);
      }
    });
    return () => source.close();
  }, [refresh, announce]);

  function handleEnableSound() {
    unlockAudio();
    setSoundEnabled(true);
  }

  return (
    <main className={`${styles.page} ${flash ? "flash-active" : ""}`}>
      <button
        className={`btn ${soundEnabled ? "btn-ghost" : "btn-accent"} ${styles.soundBtn}`}
        onClick={handleEnableSound}
      >
        {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        {soundEnabled ? "Sound Enabled" : "Enable Sound Announcements"}
      </button>

      <header className={styles.header}>
        <div className={styles.brand}>
          <Tv size={36} />
          <div>
            <h1>Smart Queue Display</h1>
            <p>ລະບົບສະແດງຄິວ — Now Serving Board</p>
          </div>
        </div>
        <div className={styles.clock}>
          <div className={styles.clockTime}>
            {now ? now.toLocaleTimeString("en-GB") : "--:--:--"}
          </div>
          <div className={styles.clockDate}>
            {now ? now.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : ""}
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        <section>
          <h2 className={styles.sectionTitle}>Now Serving / ກຳລັງບໍລິການ</h2>
          <div className={styles.servingGrid}>
            {counters.map((c) => (
              <div
                key={c.id}
                className={`glass ${styles.servingCard} ${c.currentQueue ? styles.calling : ""} animate-fade-in`}
              >
                <div className={styles.counterLabel}>{c.name}</div>
                {c.currentQueue ? (
                  <>
                    <div className={`${styles.servingNumber} queue-number`}>{c.currentQueue.queueNumber}</div>
                    <div className="text-muted">{c.currentQueue.serviceType.name}</div>
                  </>
                ) : (
                  <div className={styles.servingIdle}>—</div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>
            <Users size={18} /> Upcoming Queues / ຄິວຕໍ່ໄປ ({waiting.length})
          </h2>
          <div className={`glass card ${styles.upcomingList}`}>
            {waiting.length === 0 ? (
              <div className={styles.empty}>No tickets waiting.</div>
            ) : (
              waiting.map((q, i) => (
                <div key={q.id} className={styles.upcomingRow} style={{ animationDelay: `${i * 50}ms` }}>
                  <span className={`${styles.upcomingNumber} queue-number`}>{q.queueNumber}</span>
                  <span className={styles.upcomingService}>{q.serviceType.name}</span>
                  {q.serviceType.priority > 1 && <span className="badge badge-waiting">VIP</span>}
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {overlay && (
        <div className={styles.overlay}>
          <div className={`glass-strong ${styles.overlayCard} glow-pulse`}>
            <div className={styles.overlayLabel}>Now Calling</div>
            <div className={`${styles.overlayNumber} queue-number`}>{overlay.queueNumber}</div>
            <div className={styles.overlayCounter}>
              ກະລຸນາໄປທີ່ {overlay.counter?.name} / Please proceed to {overlay.counter?.name}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
