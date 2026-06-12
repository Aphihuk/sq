import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export const chartTextColor = "#aab4cc";
export const chartGridColor = "rgba(125, 138, 163, 0.12)";

export const chartPalette = [
  "#2dd4bf", // teal / primary
  "#22d3ee", // cyan
  "#fbbf24", // accent gold
  "#34d399", // success
  "#fb7185", // danger
  "#a78bfa",
];
