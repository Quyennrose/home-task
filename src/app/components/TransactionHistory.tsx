import { motion } from "motion/react";
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";

interface Transaction {
  id: string;
  type: "buy" | "sell";
  asset: string;
  symbol: string;
  amount: number;
  price: number;
  total: number;
  time: string;
  status: "completed" | "pending";
}

const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "buy",
    asset: "Renewable Energy Credits",
    symbol: "REC",
    amount: 50,
    price: 24.50,
    total: 1225,
    time: "2 phút trước",
    status: "completed"
  },
  {
    id: "2",
    type: "sell",
    asset: "Forest Carbon Offset",
    symbol: "FCO",
    amount: 30,
    price: 18.75,
    total: 562.50,
    time: "15 phút trước",
    status: "completed"
  },
  {
    id: "3",
    type: "buy",
    asset: "Solar Power Credits",
    symbol: "SPC",
    amount: 75,
    price: 32.10,
    total: 2407.50,
    time: "1 giờ trước",
    status: "completed"
  },
  {
    id: "4",
    type: "buy",
    asset: "Ocean Blue Carbon",
    symbol: "OBC",
    amount: 100,
    price: 15.20,
    total: 1520,
    time: "2 giờ trước",
    status: "completed"
  },
  {
    id: "5",
    type: "sell",
    asset: "Renewable Energy Credits",
    symbol: "REC",
    amount: 25,
    price: 24.30,
    total: 607.50,
    time: "3 giờ trước",
    status: "completed"
  },
  {
    id: "6",
    type: "buy",
    asset: "Forest Carbon Offset",
    symbol: "FCO",
    amount: 60,
    price: 19.20,
    total: 1152,
    time: "5 giờ trước",
    status: "pending"
  }
];

export function TransactionHistory() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden"
    >
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-slate-100 text-xl font-semibold">Lịch sử giao dịch</h2>
        <p className="text-slate-400 text-sm mt-1">Các giao dịch gần đây của bạn</p>
      </div>

      <div className="divide-y divide-slate-800/50">
        {mockTransactions.map((transaction, index) => (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
            className="p-4 hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className={`p-2 rounded-lg ${
                  transaction.type === "buy" 
                    ? "bg-emerald-500/10" 
                    : "bg-red-500/10"
                }`}>
                  {transaction.type === "buy" ? (
                    <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-red-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${
                      transaction.type === "buy" ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {transaction.type === "buy" ? "Mua" : "Bán"}
                    </span>
                    <span className="text-slate-300 font-medium">{transaction.symbol}</span>
                    {transaction.status === "pending" && (
                      <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-xs rounded-full">
                        Đang xử lý
                      </span>
                    )}
                  </div>
                  
                  <div className="text-slate-400 text-sm">
                    {transaction.amount.toLocaleString()} tCO₂ @ ${transaction.price.toFixed(2)}
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{transaction.time}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className={`font-mono font-medium ${
                  transaction.type === "buy" ? "text-slate-300" : "text-emerald-400"
                }`}>
                  {transaction.type === "buy" ? "-" : "+"}${transaction.total.toLocaleString()}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900/30">
        <button className="w-full text-center text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors">
          Xem tất cả giao dịch
        </button>
      </div>
    </motion.div>
  );
}
