"use client";

import { useState } from "react";
import { Plus, Headset, Power } from "lucide-react";
import styles from "../admin.module.css";

export default function CountersTab({ counters, onAction, refresh }) {
  const [form, setForm] = useState({ id: "", name: "" });
  const [submitting, setSubmitting] = useState(false);

  async function handleToggle(id) {
    await onAction({ action: "TOGGLE_COUNTER", id });
    refresh();
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.id.trim() || !form.name.trim()) return;
    setSubmitting(true);
    try {
      await onAction({ action: "CREATE_COUNTER", id: form.id.trim(), name: form.name.trim() });
      setForm({ id: "", name: "" });
      refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`glass ${styles.listCard}`}>
      <div className={styles.listHeader}>
        <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Headset size={18} /> Service Counters
        </h3>
      </div>

      {counters.map((c) => (
        <div className={styles.row} key={c.id}>
          <div className={styles.rowPrefix}>{c.id}</div>
          <div className={styles.rowInfo}>
            <span>{c.name}</span>
            <span className={styles.rowMeta}>Terminal ID: {c.id}</span>
          </div>
          <span className={`badge ${c.status === "ACTIVE" ? "badge-active" : "badge-inactive"}`}>{c.status}</span>
          <div className={styles.rowActions}>
            <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(c.id)}>
              <Power size={16} /> {c.status === "ACTIVE" ? "Deactivate" : "Activate"}
            </button>
          </div>
        </div>
      ))}

      <form className={styles.formRow} onSubmit={handleAdd}>
        <div className="field" style={{ maxWidth: 100 }}>
          <label className="label">Terminal ID</label>
          <input
            className="input"
            placeholder="4"
            value={form.id}
            onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
          />
        </div>
        <div className="field">
          <label className="label">Counter Name</label>
          <input
            className="input"
            placeholder="Counter 4"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <button className="btn btn-primary" disabled={submitting} type="submit">
          <Plus size={18} /> Add Counter
        </button>
      </form>
    </div>
  );
}
