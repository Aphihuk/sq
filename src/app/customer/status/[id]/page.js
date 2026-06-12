"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  AlertOctagon,
  Volume2,
  Bell,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
} from "lucide-react";
import styles from "./page.module.css";
import { playChime, speak, spellQueueNumber, unlockAudio } from "@/lib/audio";

export default function CustomerStatusPage({ params }) {
  const { id } = use(params);

  const [state, setState] = useState({ loading: true, error: null, queue: null, positionAhead: 0, estimatedWaitMinutes: 0 });
  const [aheadNumbers, setAheadNumbers] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const prevStatus = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/queue/${id}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Queue not found");
      setState({ loading: false, error: null, queue: json.queue, positionAhead: json.positionAhead, estimatedWaitMinutes: json.estimatedWaitMinutes });

      if (prevStatus.current && prevStatus.current !== "CALLING" && json.queue.status === "CALLING") {
        if (soundEnabled) {
          playChime();
          setTimeout(() => {
            speak(`Queue ${spellQueueNumber(json.queue.queueNumber)}, please proceed to ${json.queue.counter?.name || "the counter"}`);
          }, 600);
        }
        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
      }
      prevStatus.current = json.queue.status;
    } catch (err) {
      setState({ loading: false, error: err.message, queue: null, positionAhead: 0, estimatedWaitMinutes: 0 });
    }
  }, [id, soundEnabled]);

  const refreshAhead = useCallback(async () => {
    try {
      const res = await fetch("/api/queue");
      const json = await res.json();
      if (!json.ok) return;
      const idx = json.queues.findIndex((q) => q.id === id);
      if (idx === -1) return setAheadNumbers([]);
      const ahead = json.queues.slice(Math.max(0, idx - 5), idx);
      setAheadNumbers(ahead);
    } catch {
      // non-critical
    }
  }, [id]);

  useEffect(() => {
    refresh();
    refreshAhead();
  }, [refresh, refreshAhead]);

  useEffect(() => {
    const source = new EventSource("/api/queue/stream");
    source.addEventListener("update", () => {
      refresh();
      refreshAhead();
    });
    return () => source.close();
  }, [refresh, refreshAhead]);

  function handleEnableSound() {
    unlockAudio();
    setSoundEnabled(true);
  }

  if (state.loading) {
    return (
      <div className={styles.center}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (state.error || !state.queue) {
    return (
      <div className={styles.center}>
        <div className={`glass ${styles.resultCard} animate-fade-in`}>
          <div className={`${styles.resultIcon} ${styles.skipped}`}>
            <AlertOctagon size={32} />
          </div>
          <h3>Ticket Not Found</h3>
          <p className="text-muted" style={{ marginTop: 8 }}>{state.error || "This ticket does not exist."}</p>
          <Link href="/customer/register" className="btn btn-primary" style={{ marginTop: 24 }}>
            Get a New Ticket <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  const { queue, positionAhead, estimatedWaitMinutes } = state;
  const isCalling = queue.status === "CALLING";
  const isCompleted = queue.status === "COMPLETED";
  const isSkipped = queue.status === "SKIPPED";
  const progressPercent = Math.max(6, Math.min(100, 100 - positionAhead * 14));

  if (isCompleted) {
    return (
      <div className={styles.center}>
        <div className={`glass ${styles.resultCard} animate-fade-in`}>
          <div className={`${styles.resultIcon} ${styles.success}`}>
            <CheckCircle2 size={32} />
          </div>
          <h3>ຂອບໃຈ! / Thank You!</h3>
          <p className="text-muted" style={{ marginTop: 8 }}>
            Your service has been successfully completed.
          </p>
          <p className="queue-number" style={{ fontSize: "2rem", marginTop: 16 }}>{queue.queueNumber}</p>
          <Link href="/customer/register" className="btn btn-primary" style={{ marginTop: 24 }}>
            Get Another Ticket <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  if (isSkipped) {
    return (
      <div className={styles.center}>
        <div className={`glass ${styles.resultCard} animate-fade-in`}>
          <div className={`${styles.resultIcon} ${styles.skipped}`}>
            <XCircle size={32} />
          </div>
          <h3>Ticket Skipped</h3>
          <p className="text-muted" style={{ marginTop: 8 }}>
            ຂໍອະໄພ, ຄິວຂອງທ່ານຖືກຂ້າມໄປ. ກະລຸນາລົງທະບຽນໃໝ່.
            <br />
            Sorry, your ticket was skipped. Please register again.
          </p>
          <Link href="/customer/register" className="btn btn-primary" style={{ marginTop: 24 }}>
            Get a New Ticket <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className={`${styles.page} ${isCalling ? "flash-active" : ""}`}>
      {!soundEnabled && (
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }} onClick={handleEnableSound}>
          <Bell size={16} /> Enable Sound &amp; Vibration Alerts
        </button>
      )}

      <div className={`${styles.header} animate-fade-in`}>
        <p className={styles.serviceName}>{queue.serviceType.name}</p>
        <h2>ໝາຍເລກຄິວຂອງທ່ານ / Your Queue Number</h2>
      </div>

      <section className={`glass ${styles.numberCard} ${isCalling ? styles.calling : ""} animate-scale-in`}>
        <div className={`badge ${isCalling ? "badge-calling" : "badge-waiting"}`}>
          {isCalling ? "CALLING NOW" : "WAITING"}
        </div>
        <div className={`${styles.queueNumber} queue-number`}>{queue.queueNumber}</div>
        {isCalling ? (
          <p style={{ color: "var(--cyan)", fontWeight: 700 }}>
            ກະລຸນາໄປທີ່ {queue.counter?.name} / Please proceed to {queue.counter?.name}
          </p>
        ) : (
          <p className="text-muted">{queue.customerName}</p>
        )}
      </section>

      {!isCalling && (
        <section className={`glass ${styles.infoCard} animate-fade-in`}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>ລຳດັບຄິວ / Position in line</span>
            <span className={styles.infoValue}>{positionAhead === 0 ? "Next!" : `#${positionAhead + 1}`}</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="text-muted" style={{ fontSize: "0.85rem" }}>
            {positionAhead === 0
              ? "ທ່ານເປັນຄົນຕໍ່ໄປ! / You are next in line."
              : `ມີ ${positionAhead} ຄິວຢູ່ຂ້າງໜ້າ / ${positionAhead} ticket(s) ahead of you.`}
          </p>
          <div className={styles.waitBadge}>
            <Clock size={16} /> Est. wait ~ {estimatedWaitMinutes} min
          </div>
        </section>
      )}

      {!isCalling && aheadNumbers.length > 0 && (
        <section className={`${styles.aheadSection} animate-fade-in`}>
          <p className={styles.aheadLabel}>Queues Ahead</p>
          <div className={styles.aheadRow}>
            {aheadNumbers.map((q) => (
              <div
                key={q.id}
                className={`glass ${styles.aheadChip} ${q.status === "CALLING" ? styles.calling : ""}`}
              >
                {q.queueNumber}
              </div>
            ))}
          </div>
        </section>
      )}

      {isCalling && (
        <div className={styles.overlay}>
          <div className={`glass-strong ${styles.overlayCard}`}>
            <div className={styles.overlayIcon}>
              <Volume2 size={36} />
            </div>
            <h3>ຮອດຄິວຂອງທ່ານແລ້ວ! / It&apos;s Your Turn!</h3>
            <p className="text-muted" style={{ marginTop: 8 }}>Please proceed to</p>
            <div className={`${styles.overlayCounter} queue-number`}>{queue.counter?.name}</div>
            <p className="queue-number" style={{ fontSize: "1.6rem", marginTop: 8 }}>{queue.queueNumber}</p>
          </div>
        </div>
      )}
    </main>
  );
}
