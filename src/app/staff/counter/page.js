"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Users,
  CheckCircle2,
  XCircle,
  PhoneCall,
  RotateCcw,
  SkipForward,
  Check,
  Loader2,
  Headset,
  Clock,
} from "lucide-react";
import styles from "./page.module.css";

const STORAGE_KEY = "smartqueue_counter_id";
const TABS = [
  { key: "WAITING", label: "Waiting" },
  { key: "COMPLETED", label: "Served" },
  { key: "SKIPPED", label: "Skipped" },
];

export default function StaffCounterPage() {
  const [counters, setCounters] = useState([]);
  const [stats, setStats] = useState({ totalWaiting: 0, servedToday: 0, skippedToday: 0 });
  const [counterId, setCounterId] = useState(null);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [callServiceTypeId, setCallServiceTypeId] = useState("");
  const [waiting, setWaiting] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("WAITING");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setCounterId(saved);
  }, []);

  function showToast(message, type = "info") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  const loadCounters = useCallback(async () => {
    const res = await fetch("/api/counter");
    const json = await res.json();
    if (json.ok) {
      setCounters(json.counters);
      setStats(json.stats);
    }
  }, []);

  const loadQueue = useCallback(async () => {
    const res = await fetch("/api/queue");
    const json = await res.json();
    if (json.ok) {
      setWaiting(json.queues.filter((q) => q.status === "WAITING"));
      setServiceTypes(json.serviceTypes);
    }
  }, []);

  const loadHistory = useCallback(async (status) => {
    const res = await fetch(`/api/queue?status=${status}`);
    const json = await res.json();
    if (json.ok) setHistory(json.queues);
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadCounters(), loadQueue()]);
    if (tab !== "WAITING") await loadHistory(tab);
    setLoading(false);
  }, [loadCounters, loadQueue, loadHistory, tab]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (tab !== "WAITING") loadHistory(tab);
  }, [tab, loadHistory]);

  useEffect(() => {
    const source = new EventSource("/api/queue/stream");
    source.addEventListener("update", () => refreshAll());
    return () => source.close();
  }, [refreshAll]);

  function handleSelectCounter(id) {
    setCounterId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  async function handleAction(action, extra = {}) {
    setActionLoading(true);
    try {
      const res = await fetch("/api/counter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, counterId, ...extra }),
      });
      const json = await res.json();
      if (!json.ok) {
        showToast(json.message || json.error, "error");
        return;
      }
      await refreshAll();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
          <Loader2 className="animate-spin" size={32} />
        </div>
      </main>
    );
  }

  const activeCounters = counters.filter((c) => c.status === "ACTIVE");
  const selectedCounter = counters.find((c) => c.id === counterId);
  const currentQueue = selectedCounter?.currentQueue || null;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>Staff Counter Dashboard</h1>
          <p>ໜ້າຈໍຄວບຄຸມສຳລັບພະນັກງານບໍລິການ</p>
        </div>
        <div className={`glass card-sm ${styles.counterSelect}`}>
          <Headset size={20} />
          <select
            className="select"
            value={counterId || ""}
            onChange={(e) => handleSelectCounter(e.target.value)}
          >
            <option value="" disabled>Select Counter</option>
            {activeCounters.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </header>

      <section className={styles.statsRow}>
        <div className={`glass ${styles.statCard}`}>
          <div className={styles.statIcon} style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
            <Users size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.totalWaiting}</div>
            <div className={styles.statLabel}>Total Waiting</div>
          </div>
        </div>
        <div className={`glass ${styles.statCard}`}>
          <div className={styles.statIcon} style={{ background: "var(--success-soft)", color: "var(--success)" }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.servedToday}</div>
            <div className={styles.statLabel}>Served Today</div>
          </div>
        </div>
        <div className={`glass ${styles.statCard}`}>
          <div className={styles.statIcon} style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
            <XCircle size={22} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.skippedToday}</div>
            <div className={styles.statLabel}>Skipped Today</div>
          </div>
        </div>
      </section>

      <div className={styles.layout}>
        {/* Left column */}
        <section className={`glass ${styles.activeCard} animate-fade-in`}>
          {!counterId ? (
            <div className={styles.idleBox}>
              <div className={styles.idleIcon}><Headset size={28} /></div>
              <p>Please select a counter to begin.</p>
            </div>
          ) : currentQueue ? (
            <>
              <div className="badge badge-calling">Now Serving</div>
              <div className={`${styles.activeNumber} queue-number`}>{currentQueue.queueNumber}</div>
              <div className={styles.activeMeta}>
                <span>{currentQueue.customerName}</span>
                <span className="text-dim">{currentQueue.serviceType.name}</span>
              </div>
              <div className={styles.actionRow}>
                <button className="btn btn-ghost" disabled={actionLoading} onClick={() => handleAction("RECALL", { queueId: currentQueue.id })}>
                  <RotateCcw size={18} /> Recall
                </button>
                <button className="btn btn-danger" disabled={actionLoading} onClick={() => handleAction("SKIP", { queueId: currentQueue.id })}>
                  <SkipForward size={18} /> Skip
                </button>
                <button className="btn btn-primary" disabled={actionLoading} onClick={() => handleAction("COMPLETE", { queueId: currentQueue.id })}>
                  <Check size={18} /> Complete
                </button>
              </div>
            </>
          ) : (
            <div className={styles.idleBox}>
              <div className={styles.idleIcon}><Clock size={28} /></div>
              <p>Counter Idle — {waiting.length} ticket(s) waiting</p>
            </div>
          )}

          {counterId && (
            <div className={styles.callSection}>
              <div className={styles.callRow}>
                <select className="select" value={callServiceTypeId} onChange={(e) => setCallServiceTypeId(e.target.value)}>
                  <option value="">Any category (priority order)</option>
                  {serviceTypes.map((st) => (
                    <option key={st.id} value={st.id}>{st.name} ({st.prefix})</option>
                  ))}
                </select>
                <button
                  className="btn btn-cyan btn-block"
                  disabled={actionLoading || !!currentQueue}
                  onClick={() => handleAction("CALL_NEXT", callServiceTypeId ? { serviceTypeId: callServiceTypeId } : {})}
                  style={{ flexBasis: "100%" }}
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <PhoneCall size={18} />}
                  Call Next Queue
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right column */}
        <section className={`glass ${styles.queueListCard} animate-fade-in`}>
          <div className={`glass ${styles.tabBar}`}>
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`${styles.tabBtn} ${tab === t.key ? styles.active : ""}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className={styles.queueList}>
            {tab === "WAITING" ? (
              waiting.length === 0 ? (
                <div className={styles.empty}>No customers waiting.</div>
              ) : (
                waiting.map((q) => (
                  <div key={q.id} className={styles.queueRow}>
                    <div className={styles.queueRowLeft}>
                      <span className={styles.queueRowNumber}>{q.queueNumber}</span>
                      <div className={styles.queueRowInfo}>
                        <span>{q.customerName}</span>
                        <span>{q.serviceType.name}</span>
                      </div>
                    </div>
                    {q.serviceType.priority > 1 && <span className="badge badge-waiting">VIP</span>}
                  </div>
                ))
              )
            ) : history.length === 0 ? (
              <div className={styles.empty}>No records yet today.</div>
            ) : (
              history.map((q) => (
                <div key={q.id} className={styles.queueRow}>
                  <div className={styles.queueRowLeft}>
                    <span className={styles.queueRowNumber}>{q.queueNumber}</span>
                    <div className={styles.queueRowInfo}>
                      <span>{q.customerName}</span>
                      <span>{q.serviceType.name} {q.counter ? `· ${q.counter.name}` : ""}</span>
                    </div>
                  </div>
                  <span className={`badge badge-${q.status.toLowerCase()}`}>{q.status}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {toast && (
        <div
          className={`glass-strong ${styles.toast}`}
          style={{ color: toast.type === "error" ? "var(--danger)" : "var(--text)" }}
        >
          {toast.message}
        </div>
      )}
    </main>
  );
}
