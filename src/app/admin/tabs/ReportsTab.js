"use client";

import { Bar } from "react-chartjs-2";
import { Clock, Timer, TrendingUp, BarChart3 } from "lucide-react";
import "../chartSetup";
import { chartPalette, chartTextColor, chartGridColor } from "../chartSetup";
import styles from "../admin.module.css";

export default function ReportsTab({ analytics }) {
  const { serviceTypeBreakdown, avgWaitMinutes, avgServiceMinutes, statusBreakdown, total } = analytics;

  const labels = Object.keys(serviceTypeBreakdown);
  const values = Object.values(serviceTypeBreakdown);

  const completionRate =
    statusBreakdown.COMPLETED + statusBreakdown.SKIPPED > 0
      ? Math.round((statusBreakdown.COMPLETED / (statusBreakdown.COMPLETED + statusBreakdown.SKIPPED)) * 100)
      : 100;

  const data = {
    labels,
    datasets: [
      {
        label: "Tickets",
        data: values,
        backgroundColor: chartPalette,
        borderRadius: 8,
        maxBarThickness: 60,
      },
    ],
  };

  const options = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: chartTextColor, precision: 0 }, grid: { color: chartGridColor } },
      y: { ticks: { color: chartTextColor }, grid: { display: false } },
    },
  };

  return (
    <div>
      <div className={styles.statsGrid}>
        <StatCard icon={<Clock size={22} />} color="accent" value={`${avgWaitMinutes} min`} label="Avg Wait Time" />
        <StatCard icon={<Timer size={22} />} color="cyan" value={`${avgServiceMinutes} min`} label="Avg Service Time" />
        <StatCard icon={<TrendingUp size={22} />} color="success" value={`${completionRate}%`} label="Completion Rate" />
        <StatCard icon={<BarChart3 size={22} />} color="primary" value={total} label="Total Tickets" />
      </div>

      <div className={`glass ${styles.chartCard}`}>
        <h3>Tickets Served by Category (Today)</h3>
        <div className={styles.chartBox} style={{ height: Math.max(220, labels.length * 60) }}>
          {labels.length === 0 ? (
            <p className="text-dim">No tickets recorded yet today.</p>
          ) : (
            <Bar data={data} options={options} />
          )}
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
