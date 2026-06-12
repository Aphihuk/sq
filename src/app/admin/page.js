"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutDashboard, Tag, Headset, QrCode, BarChart3, ShieldCheck, Loader2 } from "lucide-react";
import styles from "./page.module.css";
import OverviewTab from "./tabs/OverviewTab";
import CategoriesTab from "./tabs/CategoriesTab";
import CountersTab from "./tabs/CountersTab";
import QrConfigTab from "./tabs/QrConfigTab";
import ReportsTab from "./tabs/ReportsTab";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "categories", label: "Queue Categories", icon: Tag },
  { key: "counters", label: "Counters", icon: Headset },
  { key: "qr", label: "QR Configuration", icon: QrCode },
  { key: "reports", label: "Reports & Analytics", icon: BarChart3 },
];

const TAB_DESCRIPTIONS = {
  overview: "Live snapshot of today's queue activity.",
  categories: "Create, rename and prioritize service categories.",
  counters: "Activate or deactivate service counter terminals.",
  qr: "Configure static or daily-rotating QR check-in codes.",
  reports: "Historical performance and wait time analytics.",
};

export default function AdminPage() {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin");
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const source = new EventSource("/api/queue/stream");
    source.addEventListener("update", () => refresh());
    return () => source.close();
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function callAdminAction(payload) {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) {
        setToast({ message: json.error || "Action failed", type: "error" });
        return null;
      }
      return json;
    } catch (err) {
      setToast({ message: err.message, type: "error" });
      return null;
    }
  }

  if (loading || !data) {
    return (
      <main className="flex items-center justify-center" style={{ minHeight: "100svh" }}>
        <Loader2 className="animate-spin" size={32} />
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <aside className={`glass ${styles.sidebar}`}>
        <div className={styles.brand}>
          <ShieldCheck size={28} color="var(--primary-strong)" />
          <div>
            <h2>Admin Panel</h2>
            <p>Smart Queue System</p>
          </div>
        </div>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`${styles.navBtn} ${tab === t.key ? styles.active : ""}`}
            onClick={() => setTab(t.key)}
          >
            <t.icon size={18} /> {t.label}
          </button>
        ))}
      </aside>

      <div className={styles.content}>
        <div className={styles.contentHeader}>
          <h1>{TABS.find((t) => t.key === tab)?.label}</h1>
          <p>{TAB_DESCRIPTIONS[tab]}</p>
        </div>

        {tab === "overview" && <OverviewTab analytics={data.analytics} />}
        {tab === "categories" && (
          <CategoriesTab serviceTypes={data.serviceTypes} onAction={callAdminAction} refresh={refresh} />
        )}
        {tab === "counters" && (
          <CountersTab counters={data.counters} onAction={callAdminAction} refresh={refresh} />
        )}
        {tab === "qr" && <QrConfigTab settings={data.settings} onAction={callAdminAction} refresh={refresh} />}
        {tab === "reports" && <ReportsTab analytics={data.analytics} />}
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
