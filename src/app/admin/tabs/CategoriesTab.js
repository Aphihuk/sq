"use client";

import { useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";
import styles from "../admin.module.css";

export default function CategoriesTab({ serviceTypes, onAction, refresh }) {
  const [form, setForm] = useState({ name: "", prefix: "", priority: 1 });
  const [submitting, setSubmitting] = useState(false);

  async function handleUpdate(id, data) {
    await onAction({ action: "UPDATE_SERVICE_TYPE", id, ...data });
    refresh();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this service category? This cannot be undone.")) return;
    await onAction({ action: "DELETE_SERVICE_TYPE", id });
    refresh();
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.prefix.trim()) return;
    setSubmitting(true);
    try {
      await onAction({ action: "CREATE_SERVICE_TYPE", ...form });
      setForm({ name: "", prefix: "", priority: 1 });
      refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`glass ${styles.listCard}`}>
      <div className={styles.listHeader}>
        <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Tag size={18} /> Queue Categories
        </h3>
      </div>

      {serviceTypes.map((st) => (
        <div className={styles.row} key={st.id}>
          <input
            className={styles.editablePrefix}
            style={{ width: 48, height: 48, flexShrink: 0 }}
            defaultValue={st.prefix}
            maxLength={2}
            onBlur={(e) => {
              const val = e.target.value.toUpperCase();
              if (val !== st.prefix && val) handleUpdate(st.id, { prefix: val });
            }}
          />
          <div className={styles.rowInfo}>
            <input
              className={styles.editable}
              defaultValue={st.name}
              onBlur={(e) => {
                if (e.target.value !== st.name && e.target.value.trim()) {
                  handleUpdate(st.id, { name: e.target.value.trim() });
                }
              }}
            />
            <span className={styles.rowMeta}>Priority weight (higher = served first)</span>
          </div>
          <input
            type="number"
            min="1"
            max="10"
            className={`input ${styles.miniInput}`}
            defaultValue={st.priority}
            onBlur={(e) => {
              const val = Number(e.target.value);
              if (val !== st.priority && val >= 1) handleUpdate(st.id, { priority: val });
            }}
          />
          <div className={styles.rowActions}>
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(st.id)}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}

      <form className={styles.formRow} onSubmit={handleAdd}>
        <div className="field">
          <label className="label">Category Name</label>
          <input
            className="input"
            placeholder="e.g. ບໍລິການກູ້ຢືມ / Loan Service"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="field" style={{ maxWidth: 100 }}>
          <label className="label">Prefix</label>
          <input
            className="input"
            placeholder="D"
            maxLength={2}
            value={form.prefix}
            onChange={(e) => setForm((f) => ({ ...f, prefix: e.target.value.toUpperCase() }))}
          />
        </div>
        <div className="field" style={{ maxWidth: 120 }}>
          <label className="label">Priority</label>
          <input
            type="number"
            min="1"
            max="10"
            className="input"
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
          />
        </div>
        <button className="btn btn-primary" disabled={submitting} type="submit">
          <Plus size={18} /> Add Category
        </button>
      </form>
    </div>
  );
}
