import { motion } from "motion/react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CarbonAsset {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume: string;
  holdings: number;
  totalValue: number;
  origin: string;
}

const mockAssets: CarbonAsset[] = [
  {
    id: "1",
    name: "Renewable Energy Credits",
    symbol: "REC",
    price: 24.50,
    change24h: 5.2,
    volume: "1.2M",
    holdings: 450,
    totalValue: 11025,
    origin: "Wind Farm - EU"
  },
  {
    id: "2",
    name: "Forest Carbon Offset",
    symbol: "FCO",
    price: 18.75,
    change24h: -2.1,
    volume: "890K",
    holdings: 320,
    totalValue: 6000,
    origin: "Amazon Rainforest"
  },
  {
    id: "3",
    name: "Solar Power Credits",
    symbol: "SPC",
    price: 32.10,
    change24h: 8.5,
    volume: "2.1M",
    holdings: 200,
    totalValue: 6420,
    origin: "Solar Farm - Asia"
  },
  {
    id: "4",
    name: "Ocean Blue Carbon",
    symbol: "OBC",
    price: 15.20,
    change24h: 3.8,
    volume: "650K",
    holdings: 180,
    totalValue: 2736,
    origin: "Mangrove - Indonesia"
  }
];

export function CarbonAssets() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden"
    >
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-slate-100 text-xl font-semibold">Danh mục Carbon Credits</h2>
        <p className="text-slate-400 text-sm mt-1">Tài sản của bạn trên sàn giao dịch</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-sm">
              <th className="text-left p-4 font-medium">Tài sản</th>
              <th className="text-right p-4 font-medium">Giá</th>
              <th className="text-right p-4 font-medium">24h</th>
              <th className="text-right p-4 font-medium">Khối lượng</th>
              <th className="text-right p-4 font-medium">Nắm giữ</th>
              <th className="text-right p-4 font-medium">Tổng giá trị</th>
            </tr>
          </thead>
          <tbody>
            {mockAssets.map((asset, index) => (
              <motion.tr
                key={asset.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
              >
                <td className="p-4">
                  <div>
                    <div className="text-slate-100 font-medium">{asset.name}</div>
                    <div className="text-slate-500 text-sm">{asset.symbol} • {asset.origin}</div>
                  </div>
                </td>
                <td className="text-right p-4">
                  <div className="text-slate-100 font-mono">${asset.price.toFixed(2)}</div>
                </td>
                <td className="text-right p-4">
                  <div className={`flex items-center justify-end gap-1 ${
                    asset.change24h >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {asset.change24h >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="font-medium">{Math.abs(asset.change24h)}%</span>
                  </div>
                </td>
                <td className="text-right p-4">
                  <div className="text-slate-300 font-mono">{asset.volume}</div>
                </td>
                <td className="text-right p-4">
                  <div className="text-slate-300">{asset.holdings.toLocaleString()} tCO₂</div>
                </td>
                <td className="text-right p-4">
                  <div className="text-emerald-400 font-mono font-medium">
                    ${asset.totalValue.toLocaleString()}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
