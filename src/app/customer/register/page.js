"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Star, ArrowRight, AlertOctagon, QrCode } from "lucide-react";
import styles from "./page.module.css";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [data, setData] = useState({ loading: true, serviceTypes: [], settings: null, error: null });
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submittingId, setSubmittingId] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    fetch("/api/queue")
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error);
        setData({ loading: false, serviceTypes: json.serviceTypes, settings: json.settings, error: null });
      })
      .catch((err) => setData({ loading: false, serviceTypes: [], settings: null, error: err.message }));
  }, []);

  async function handleSelect(serviceTypeId) {
    setSubmittingId(serviceTypeId);
    setSubmitError(null);
    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceTypeId, customerName, customerPhone, token }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || json.error || "Registration failed");
      router.push(`/customer/status/${json.queue.id}`);
    } catch (err) {
      setSubmitError(err.message);
      setSubmittingId(null);
    }
  }

  if (data.loading) {
    return (
      <div className={styles.center}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (data.error) {
    return (
      <div className={styles.center}>
        <div className={`glass ${styles.errorCard} animate-fade-in`}>
          <div className={styles.errorIcon}>
            <AlertOctagon size={28} />
          </div>
          <h3>Connection Error</h3>
          <p className="text-muted" style={{ marginTop: 8 }}>{data.error}</p>
        </div>
      </div>
    );
  }

  const tokenInvalid =
    data.settings?.qrType === "DAILY" &&
    (!token || token !== data.settings.dailyToken);

  if (tokenInvalid) {
    return (
      <div className={styles.center}>
        <div className={`glass ${styles.errorCard} animate-fade-in`}>
          <div className={styles.errorIcon}>
            <QrCode size={28} />
          </div>
          <h3>QR Code Expired</h3>
          <p className="text-muted" style={{ marginTop: 8 }}>
            ກະລຸນາສະແກນ QR ໂຄດທີ່ສະຖານທີ່ໃນມື້ນີ້ / Please scan today&apos;s QR code
            displayed at the venue to register a queue ticket.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className={styles.page}>
      <div className={`${styles.header} animate-fade-in`}>
        <span className={styles.badge}>Smart Queue System</span>
        <h1 className={styles.title}>ລົງທະບຽນຄິວ</h1>
        <p className={styles.subtitle}>
          Select a service category below to receive your queue ticket instantly.
        </p>
      </div>

      <section className={`glass ${styles.card} animate-fade-in`}>
        <div className={styles.sectionLabel}>Your Details (Optional)</div>
        <div className={styles.formGrid}>
          <div className="field">
            <label className="label">ຊື່ / Name</label>
            <input
              className="input"
              placeholder="ລູກຄ້າ / Customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label">ເບີໂທ / Phone</label>
            <input
              className="input"
              placeholder="020 xxxxxxxx"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className={styles.sectionLabel} style={{ width: "100%", maxWidth: 520 }}>
        Select a Service / ເລືອກປະເພດບໍລິການ
      </div>

      <div className={styles.serviceGrid}>
        {data.serviceTypes.map((st, i) => (
          <button
            key={st.id}
            className={`glass ${styles.serviceBtn} animate-scale-in`}
            style={{ animationDelay: `${i * 70}ms` }}
            disabled={submittingId !== null}
            onClick={() => handleSelect(st.id)}
          >
            <div className={styles.serviceInfo}>
              <span className={styles.serviceName}>{st.name}</span>
              {st.priority > 1 && (
                <span className={styles.priorityTag}>
                  <Star size={12} /> Priority Service
                </span>
              )}
            </div>
            {submittingId === st.id ? (
              <Loader2 className="animate-spin" size={22} />
            ) : (
              <div className={styles.servicePrefix}>{st.prefix}</div>
            )}
          </button>
        ))}
      </div>

      {submitError && (
        <p style={{ color: "var(--danger)", marginTop: 16, textAlign: "center" }}>
          {submitError}
        </p>
      )}

      <p className="text-dim" style={{ marginTop: 32, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6 }}>
        Tap a category <ArrowRight size={14} /> get your number <ArrowRight size={14} /> track live
      </p>
    </main>
  );
}

export default function CustomerRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.center}>
          <Loader2 className="animate-spin" size={32} />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
