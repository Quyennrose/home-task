import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Activity } from "lucide-react";

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Generate mock candlestick data
const generateCandleData = (): CandleData[] => {
  const data: CandleData[] = [];
  let basePrice = 24.50;
  
  for (let i = 0; i < 30; i++) {
    const open = basePrice + (Math.random() - 0.5) * 2;
    const close = open + (Math.random() - 0.5) * 3;
    const high = Math.max(open, close) + Math.random() * 1.5;
    const low = Math.min(open, close) - Math.random() * 1.5;
    
    data.push({
      time: `${i}:00`,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(Math.random() * 50000) + 10000
    });
    
    basePrice = close;
  }
  
  return data;
};

const generateLineData = () => {
  const data = [];
  let price = 24.50;
  
  for (let i = 0; i < 50; i++) {
    price += (Math.random() - 0.48) * 0.8;
    data.push({
      time: i,
      price: Number(price.toFixed(2))
    });
  }
  
  return data;
};

export function CandlestickChart() {
  const [candleData] = useState<CandleData[]>(generateCandleData());
  const [lineData, setLineData] = useState(generateLineData());
  const [currentPrice, setCurrentPrice] = useState(lineData[lineData.length - 1].price);
  const [priceChange, setPriceChange] = useState(0);

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLineData(prev => {
        const lastPrice = prev[prev.length - 1].price;
        const newPrice = lastPrice + (Math.random() - 0.48) * 0.5;
        const change = ((newPrice - prev[0].price) / prev[0].price) * 100;
        
        setCurrentPrice(Number(newPrice.toFixed(2)));
        setPriceChange(Number(change.toFixed(2)));
        
        return [...prev.slice(1), {
          time: prev[prev.length - 1].time + 1,
          price: Number(newPrice.toFixed(2))
        }];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-emerald-400 font-mono font-medium text-lg">
            ${payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden"
    >
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-slate-100 text-xl font-semibold">REC/USD</h2>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-md">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-xs font-medium">Live</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm">Renewable Energy Credits</p>
          </div>
          <div className="text-right">
            <motion.div 
              key={currentPrice}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-slate-100 text-3xl font-mono font-semibold"
            >
              ${currentPrice.toFixed(2)}
            </motion.div>
            <div className={`flex items-center justify-end gap-1 mt-1 ${
              priceChange >= 0 ? "text-emerald-400" : "text-red-400"
            }`}>
              <TrendingUp className={`w-4 h-4 ${priceChange < 0 ? "rotate-180" : ""}`} />
              <span className="font-medium">{Math.abs(priceChange).toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                hide={true}
              />
              <YAxis 
                domain={['dataMin - 1', 'dataMax + 1']}
                hide={true}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#10b981" 
                strokeWidth={2.5}
                dot={false}
                fill="url(#priceGradient)"
                isAnimationActive={true}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Candlestick representation (simplified view) */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between text-sm mb-4">
            <span className="text-slate-400">30 phút gần nhất</span>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                <span className="text-slate-400">Tăng</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                <span className="text-slate-400">Giảm</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-end gap-1 h-20">
            {candleData.slice(-20).map((candle, index) => {
              const isGreen = candle.close >= candle.open;
              const bodyHeight = Math.abs(candle.close - candle.open) * 5;
              const wickHeight = (candle.high - candle.low) * 5;
              
              return (
                <motion.div
                  key={index}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                  className="flex-1 flex flex-col items-center justify-end"
                >
                  <div 
                    className={`w-full ${isGreen ? "bg-emerald-500" : "bg-red-500"} rounded-sm opacity-80`}
                    style={{ 
                      height: `${Math.max(bodyHeight, 2)}px`,
                      minHeight: "2px"
                    }}
                  ></div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
