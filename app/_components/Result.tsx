import { RotateCw } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type ChartDataPoint = {
  time: number;
  wpm: number;
  raw: number;
  errors: number;
};

export const Results = ({
  wpm,
  rawWpm,
  accuracy,
  errors,
  chartData,
  onRestart,
}: {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  errors: number;
  chartData: ChartDataPoint[];
  onRestart: () => void;
}) => {
  const restartButtonRef = useRef<HTMLButtonElement>(null);

  // Handle Tab and Enter keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        restartButtonRef.current?.focus();
        return;
      }

      if (
        e.key === "Enter" &&
        document.activeElement === restartButtonRef.current
      ) {
        e.preventDefault();
        e.stopPropagation();
        restartButtonRef.current?.blur();
        onRestart();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onRestart]);

  // Calculate consistency
  const calculateConsistency = () => {
    if (chartData.length < 2) return 100;

    const wpms = chartData.map((d) => d.wpm);
    const avg = wpms.reduce((a, b) => a + b, 0) / wpms.length;
    const variance =
      wpms.reduce((sum, wpm) => sum + Math.pow(wpm - avg, 2), 0) / wpms.length;
    const stdDev = Math.sqrt(variance);

    const consistency = Math.max(0, 100 - (stdDev / avg) * 100);
    return Math.round(consistency);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="wpm" value={wpm} highlight />
        <StatCard label="acc" value={`${accuracy}%`} />
        <StatCard label="raw" value={rawWpm} />
        <StatCard label="errors" value={errors} />
      </div>

      {/* Graph */}
      {chartData.length > 0 && (
        <div className="mb-6 p-6 rounded-lg bg-card/50 border border-border/50">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#3a3a3b"
                opacity={0.3}
              />
              <XAxis
                dataKey="time"
                stroke="#8a8577"
                tick={{ fill: "#8a8577", fontSize: 12 }}
                axisLine={{ stroke: "#3a3a3b" }}
              />
              <YAxis
                stroke="#8a8577"
                tick={{ fill: "#8a8577", fontSize: 12 }}
                axisLine={{ stroke: "#3a3a3b" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#2a2a2b",
                  border: "1px solid #3a3a3b",
                  borderRadius: "0.375rem",
                  color: "#ccc2b1",
                }}
                labelStyle={{ color: "#8a8577" }}
              />
              <Legend
                wrapperStyle={{ color: "#8a8577", fontSize: "14px" }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="wpm"
                stroke="#2b5f6d"
                strokeWidth={3}
                name="wpm"
                dot={{ fill: "#2b5f6d", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="raw"
                stroke="#8a8577"
                strokeWidth={2}
                name="raw"
                strokeDasharray="5 5"
                dot={{ fill: "#8a8577", r: 3, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4 rounded-lg bg-card/50 border border-border/50">
          <p className="text-muted-foreground text-xs mb-1">consistency</p>
          <p className="text-2xl font-semibold text-primary">
            {calculateConsistency()}%
          </p>
        </div>
        <div className="p-4 rounded-lg bg-card/50 border border-border/50">
          <p className="text-muted-foreground text-xs mb-1">time</p>
          <p className="text-2xl font-semibold text-primary">
            {chartData.length}s
          </p>
        </div>
      </div>

      {/* Restart Button */}
      <div className="flex justify-center">
        <button
          ref={restartButtonRef}
          onClick={onRestart}
          className="px-6 py-3 text-muted-foreground hover:text-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg"
        >
          <RotateCw className="size-7" />
        </button>
      </div>
    </motion.div>
  );
};

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="p-4 rounded-lg bg-card/50 border border-border/50 text-center">
      <p className="text-muted-foreground text-xs mb-2">{label}</p>
      <p
        className={`text-3xl font-bold ${
          highlight ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
