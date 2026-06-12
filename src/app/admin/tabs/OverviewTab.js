"use client";

import { Bar, Doughnut } from "react-chartjs-2";
import { Ticket, Clock, PhoneCall, CheckCircle2, XCircle, Hourglass } from "lucide-react";
import "../chartSetup";
import { chartPalette, chartTextColor, chartGridColor } from "../chartSetup";
import styles from "../admin.module.css";

export default function OverviewTab({ analytics }) {
  const { statusBreakdown, hourlyVolume, total, avgWaitMinutes, avgServiceMinutes } = analytics;

  const hourlyData = {
    labels: Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`),
    datasets: [
      {
        label: "Tickets",
        data: hourlyVolume,
        backgroundColor: "rgba(45, 212, 191, 0.55)",
        borderRadius: 6,
        maxBarThickness: 18,
      },
    ],
  };

  const statusData = {
    labels: ["Waiting", "Calling", "Completed", "Skipped"],
    datasets: [
      {
        data: [statusBreakdown.WAITING, statusBreakdown.CALLING, statusBreakdown.COMPLETED, statusBreakdown.SKIPPED],
        backgroundColor: [chartPalette[2], chartPalette[1], chartPalette[3], chartPalette[4]],
        borderWidth: 0,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: chartTextColor, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 }, grid: { display: false } },
      y: { ticks: { color: chartTextColor, precision: 0 }, grid: { color: chartGridColor } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom", labels: { color: chartTextColor, padding: 16 } } },
  };

  return (
    <div>
      <div className={styles.statsGrid}>
        <StatCard icon={<Ticket size={22} />} color="primary" value={total} label="Total Today" />
        <StatCard icon={<Hourglass size={22} />} color="accent" value={statusBreakdown.WAITING} label="Waiting" />
        <StatCard icon={<PhoneCall size={22} />} color="cyan" value={statusBreakdown.CALLING} label="Calling" />
        <StatCard icon={<CheckCircle2 size={22} />} color="success" value={statusBreakdown.COMPLETED} label="Completed" />
        <StatCard icon={<XCircle size={22} />} color="danger" value={statusBreakdown.SKIPPED} label="Skipped" />
        <StatCard icon={<Clock size={22} />} color="accent" value={`${avgWaitMinutes}m`} label="Avg Wait" />
      </div>

      <div className={styles.chartGrid}>
        <div className={`glass ${styles.chartCard}`}>
          <h3>Hourly Queue Volume</h3>
          <div className={styles.chartBox}>
            <Bar data={hourlyData} options={barOptions} />
          </div>
        </div>
        <div className={`glass ${styles.chartCard}`}>
          <h3>Status Breakdown</h3>
          <div className={styles.chartBox}>
            <Doughnut data={statusData} options={doughnutOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, color, value, label }) {
  return (
    <div className={`glass ${styles.statCard}`}>
      <div className={styles.statIcon} style={{ background: `var(--${color}-soft)`, color: `var(--${color === "primary" ? "primary-strong" : color})` }}>
        {icon}
      </div>
      <div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}
