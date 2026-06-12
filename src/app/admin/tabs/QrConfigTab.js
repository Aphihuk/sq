"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode, Smartphone, RefreshCw, Download } from "lucide-react";
import styles from "../admin.module.css";

export default function QrConfigTab({ settings, onAction, refresh }) {
  const [origin, setOrigin] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const registrationUrl =
    settings?.qrType === "DAILY" && settings?.dailyToken
      ? `${origin}/customer/register?token=${settings.dailyToken}`
      : `${origin}/customer/register`;

  useEffect(() => {
    if (!origin) return;
    QRCode.toDataURL(registrationUrl, {
      width: 480,
      margin: 1,
      color: { dark: "#0a0e1a", light: "#ffffff" },
    }).then(setQrDataUrl);
  }, [registrationUrl, origin]);

  async function setMode(qrType) {
    setBusy(true);
    try {
      await onAction({ action: "SET_QR_TYPE", qrType });
      refresh();
    } finally {
      setBusy(false);
    }
  }

  async function regenerateToken() {
    setBusy(true);
    try {
      await onAction({ action: "REGENERATE_TOKEN" });
      refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.qrLayout}>
      <div className={`glass ${styles.qrCard}`}>
        <h3 style={{ marginBottom: 18 }}>QR Code Mode</h3>
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeBtn} ${settings?.qrType === "STATIC" ? styles.active : ""}`}
            onClick={() => setMode("STATIC")}
            disabled={busy}
          >
            <h4>Static QR Code</h4>
            <p>One permanent QR code. Simple, but can be used from anywhere.</p>
          </button>
          <button
            className={`${styles.modeBtn} ${settings?.qrType === "DAILY" ? styles.active : ""}`}
            onClick={() => setMode("DAILY")}
            disabled={busy}
          >
            <h4>Daily Dynamic QR Code</h4>
            <p>A new secure token each day prevents off-site bookings.</p>
          </button>
        </div>

        <h4 className="text-muted" style={{ marginBottom: 10, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Customer Check-in URL
        </h4>
        <div className={styles.urlBox}>{registrationUrl}</div>

        {settings?.qrType === "DAILY" && (
          <>
            <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: 12 }}>
              Token date: <strong>{settings.tokenDate}</strong> — regenerate daily to invalidate yesterday&apos;s QR code.
            </p>
            <button className="btn btn-ghost" onClick={regenerateToken} disabled={busy}>
              <RefreshCw size={16} className={busy ? "animate-spin" : ""} /> Regenerate Token
            </button>
          </>
        )}
      </div>

      <div className={`glass ${styles.qrPreview}`}>
        <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <QrCode size={18} /> Scan to Register
        </h3>
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="Queue registration QR code" className={styles.qrImage} />
        ) : (
          <div className={`skeleton ${styles.qrImage}`} />
        )}
        <p className="text-muted" style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6 }}>
          <Smartphone size={14} /> Print &amp; place this at the entrance
        </p>
        {qrDataUrl && (
          <a className="btn btn-primary btn-block" href={qrDataUrl} download="smart-queue-qr.png">
            <Download size={18} /> Download QR Code
          </a>
        )}
      </div>
    </div>
  );
}
