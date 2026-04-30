import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  delay?: number;
  onClick?: () => void;
}

export function ServiceCard({ 
  icon: Icon, 
  title, 
  description, 
  color,
  delay = 0,
  onClick 
}: ServiceCardProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer border border-gray-100"
    >
      <div className={`${color} w-16 h-16 rounded-xl flex items-center justify-center mb-4`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-gray-900 text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      <div className="mt-4 text-blue-600 font-medium text-sm flex items-center gap-1">
        Đặt ngay <span>→</span>
      </div>
    </motion.button>
  );
}
