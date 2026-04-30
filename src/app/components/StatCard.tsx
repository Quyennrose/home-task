import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: LucideIcon;
  delay?: number;
}

export function StatCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon,
  delay = 0 
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:border-emerald-500/30 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-400 text-sm mb-2">{title}</p>
          <p className="text-slate-100 text-3xl font-semibold mb-2">{value}</p>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${
              changeType === "positive" ? "text-emerald-400" : "text-red-400"
            }`}>
              {changeType === "positive" ? "↗" : "↘"} {change}
            </span>
            <span className="text-slate-500 text-xs">vs tháng trước</span>
          </div>
        </div>
        <div className="bg-emerald-500/10 p-3 rounded-lg">
          <Icon className="w-6 h-6 text-emerald-400" />
        </div>
      </div>
    </motion.div>
  );
}
