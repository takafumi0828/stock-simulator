import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import Papa from "papaparse";
import { useMemo } from 'react';
import HowToPlay from "./components/HowToPlay";
import BenchmarkChart from "./components/BenchmarkChart";

export default function App() {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const intervalRef = useRef(null);
  const [showHowToPlay, setShowHowToPlay] = useState(true);
  const [stockData, setStockData] = useState([]);
  const [dayIndex, setDayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [company, setCompany] = useState("トヨタ");

  const [capital, setCapital] = useState(10_000_000);
  const [holding, setHolding] = useState(0);
  const [avgPrice, setAvgPrice] = useState(0);
  const [quantity, setQuantity] = useState(100);
  const [totalProfit, setTotalProfit] = useState(0);

  const [CrossEvents, setCrossEvents] = useState([]);
  const [monthlyNews, setMonthlyNews] = useState([]);
  const [yourPnlData, setYourPnlData] = useState([]);
  const [nikkeiPnL, setNikkeiPnL] = useState([]);
  const [nikkeiRawData, setNikkeiRawData] = useState([]);
  const basePath = process.env.PUBLIC_URL || "";

  const latestCross = useMemo(() => {
  if (!stockData[dayIndex] || CrossEvents.length === 0) return null;
  const currentTime = stockData[dayIndex].time;
  const occurred = CrossEvents.filter(e => e.time <= currentTime);
  return occurred.length > 0 ? occurred[occurred.length - 1] : null;
}, [stockData, dayIndex, CrossEvents]);

useEffect(() => {
  const fetchNikkeiPnL = async () => {
    const response = await fetch(`${basePath}/stock_2symbols_2y_ohlc.csv`);
    const text = await response.text();
    
    // PapaParseでヘッダ付き読み込み
    const parsed = Papa.parse(text, { header: true, dynamicTyping: true });
    console.log("PapaParse結果:", parsed.data.slice(0, 5)); // デバッグ

    // 日経平均だけ抽出
    const nikkeiRows = parsed.data.filter(
      (row) => row.symbol === "日経平均" && row.date && row.close
    );

    console.log("日経平均抽出結果:", nikkeiRows.slice(0, 5));

    const buyRecords = [];
    const pnlArray = [];
    let currentMonth = -1;

    nikkeiRows.forEach((d) => {
      const dateObj = new Date(d.date);
      const month = dateObj.getMonth() + dateObj.getFullYear() * 12;

      // 月が変わったら100株購入
      if (month !== currentMonth) {
        currentMonth = month;
        buyRecords.push({ price: d.close, shares: 100 });
      }

      // 損益計算
      const totalProfit = buyRecords.reduce((acc, rec) => {
        const valueNow = d.close * rec.shares;
        const cost = rec.price * rec.shares;
        return acc + (valueNow - cost);
      }, 0);

      pnlArray.push({ date: dateObj, profit: totalProfit });
    });

    setNikkeiPnL(pnlArray);
    console.log("計算後 nikkeiPnL:", pnlArray);
  };

  fetchNikkeiPnL();
}, []);

  const fetchStockDataFromCSV = async (symbol = "トヨタ") => {
    const response = await fetch(`${basePath}/stock_2symbols_2y_ohlc.csv`);
    const text = await response.text();
    const parsed = Papa.parse(text, { header: true, dynamicTyping: true });
    const cleaned = parsed.data.filter(
      (row) => row.symbol === symbol && row.date && row.open && row.close
    );
    const formatted = cleaned.map((row) => ({
      time: Math.floor(new Date(row.date).getTime() / 1000),
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
    }));
    setStockData(formatted);
    setDayIndex(0);
    setHolding(0);
    setCapital(10_000_000);
    setAvgPrice(0);
    setTotalProfit(0);
  };

  useEffect(() => {
    fetchStockDataFromCSV(company);
  }, [company]);

  useEffect(() => {
    if (stockData.length === 0 || !chartContainerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    const container = chartContainerRef.current;
    const width = container.clientWidth;

    const chart = createChart(container, {
  width,
  height: 300,
  layout: {
    background: { type: 'solid', color: "#1e3a8a" },
    textColor: "#ffffff",
  },
  grid: {
    vertLines: { color: "#1a1a1a" },
    horzLines: { color: "#1a1a1a" },
  },
  crossHair: { mode: 1 },
  timeScale: {
    timeVisible: true,
    barSpacing: 15,
    fixRightEdge: false,
    rightOffset: 0,
    borderVisible: true,
    ticksVisible: true,
    tickMarkFormatter: (time) => {
      const date = new Date(time * 1000);
      return `${date.getMonth() + 1}月`;
    },
  },
  priceScale: {
    scaleMargins: { top: 0.1, bottom: 0.1 },
    borderVisible: true,
    ticksVisible: true,
  },
  localization: { dateFormat: "yyyy-MM" },
});

const series = chart.addCandlestickSeries({
  upColor: "#4caf50",
  downColor: "#f44336",
  borderVisible: false,
  wickUpColor: "#4caf50",
  wickDownColor: "#f44336",
});

// データセット
series.setData(stockData.slice(0, dayIndex + 1));

        // --- 移動平均計算用関数（短期・長期） ---
    function calculateSMA(data, period) {
      return data.map((_, i) => {
        if (i < period - 1) return null;
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.close, 0);
        return {
          time: data[i].time,
          value: sum / period,
        };
      }).filter(v => v !== null);
    }

    const shortSMA = calculateSMA(stockData.slice(0, dayIndex + 1), 5);  // 5日移動平均
    const longSMA = calculateSMA(stockData.slice(0, dayIndex + 1), 25); // 25日移動平均

    // --- 移動平均線をチャートに追加 ---
    const shortSMAline = chart.addLineSeries({ color: 'orange', lineWidth: 2 });
    const longSMAline = chart.addLineSeries({ color: 'skyblue', lineWidth: 2 });

    shortSMAline.setData(shortSMA);
    longSMAline.setData(longSMA);

// --- クロスイベント検出（ゴールデン＆デッド） ---
  const events = [];

  for (let i = 1; i < shortSMA.length; i++) {
    const sPrev = shortSMA[i - 1];
    const sCurr = shortSMA[i];
    const lPrev = longSMA.find(d => d.time === sPrev.time);
    const lCurr = longSMA.find(d => d.time === sCurr.time);

    if (!lPrev || !lCurr) continue;

    const prevDiff = sPrev.value - lPrev.value;
    const currDiff = sCurr.value - lCurr.value;

    const dateStr = new Date(sCurr.time * 1000).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    if (prevDiff < 0 && currDiff >= 0) {
      // ゴールデンクロス
      events.push({
        time: sCurr.time,
        price: sCurr.value,
        type: 'golden',
        message: `✨ ゴールデンクロス発生！（${dateStr}）買い時かも！`,
      });
    } else if (prevDiff > 0 && currDiff <= 0) {
      // デッドクロス
      events.push({
        time: sCurr.time,
        price: sCurr.value,
        type: 'dead',
        message: `⚠️ デッドクロス発生！（${dateStr}）下落に注意！`,
      });
    }
  }

    setCrossEvents(events);

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [stockData, dayIndex]);

  useEffect(() => {
  if (!isPlaying || stockData.length === 0) return;

  intervalRef.current = setInterval(() => {
    setDayIndex((prev) => {
      const next = prev + 1;

      if (next < stockData.length) {
        if (seriesRef.current && chartRef.current) {
          const partialData = stockData.slice(0, next + 1);
          seriesRef.current.setData(partialData);
          chartRef.current.timeScale().scrollToRealTime(); 
        }

        return next;
      } else {
        clearInterval(intervalRef.current);
        return prev;
      }
    });
  }, 1000);

  return () => clearInterval(intervalRef.current);
}, [isPlaying, stockData]);

  const currentPrice = stockData[dayIndex]?.close ?? 0;
  const unrealizedPL = holding > 0 ? (currentPrice - avgPrice) * holding : 0;

//積立と比較用の損益データ
  useEffect(() => {
  if (dayIndex >= 0 && stockData[dayIndex]) {
    const date = stockData[dayIndex].time;
    const value = totalProfit + unrealizedPL;

    setYourPnlData((prevData) => {
      if (prevData.length > 0 && prevData[prevData.length - 1].time === date) {
        return prevData; // 重複防止
      }
      return [...prevData, { time: date, value }];
    });
  }
}, [dayIndex, totalProfit, unrealizedPL, stockData]);

  const adjustQty = (delta) => {
    setQuantity((prev) => Math.max(0, prev + delta));
  };

  const buyStock = () => {
    const cost = quantity * currentPrice;
    if (capital >= cost) {
      const newHolding = holding + quantity;
      const newAvg = (avgPrice * holding + currentPrice * quantity) / newHolding;
      setHolding(newHolding);
      setCapital(capital - cost);
      setAvgPrice(newAvg);
    } else {
      alert("資金不足です！");
    }
  };

  const sellStock = () => {
    if (holding >= quantity) {
      const profit = (currentPrice - avgPrice) * quantity;
      setTotalProfit((prev) => prev + profit);
      setHolding((prev) => prev - quantity);
      setCapital((prev) => prev + quantity * currentPrice);
      if (holding - quantity === 0) {
        setAvgPrice(0);
      }
    } else {
      alert("保有株数が足りません！");
    }
  };

  const currentDateStr = stockData[dayIndex]
    ? new Date(stockData[dayIndex].time * 1000).toISOString().slice(0, 10)
    : null;

const latestYourProfit = yourPnlData.length > 0 
  ? yourPnlData[Math.min(dayIndex, yourPnlData.length - 1)].profit || 0 
  : 0;

const latestNikkeiProfit = nikkeiPnL.length > 0 
  ? nikkeiPnL[Math.min(dayIndex, nikkeiPnL.length - 1)].profit || 0 
  : 0;

const ranking = [
  { name: "あなた", profit: latestYourProfit },
  { name: "日経平均", profit: latestNikkeiProfit }
].sort((a, b) => b.profit - a.profit);

  return (
  <div className="p-4">
    {showHowToPlay && <HowToPlay onClose={() => setShowHowToPlay(false)} />}

    <div className="bg-gradient-to-b from-blue-900 to-blue-700 text-white font-sans min-h-screen flex flex-col items-center">
      <h2 className="text-lg mb-4">投資体験シミュレーター</h2>

      {/* 会社選択 */}
      <div className="mb-4">
        <label className="mr-2">会社を選ぶ：</label>
        <select
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="text-black p-1 rounded"
        >
          <option value="トヨタ">トヨタ</option>
          <option value="任天堂">任天堂</option>
        </select>
      </div>

      {/* 上段：株価チャート + ニュース + コントロール */}
      <div className="flex max-w-6xl w-full space-x-4">

        {/* 左：株価チャート + ランキング */}
        <div className="flex flex-col flex-1 space-y-2">
          {/* 株価チャート */}
          <div
            ref={chartContainerRef}
            className="bg-[#121212] rounded-lg shadow"
            style={{ backgroundColor: "#001f3f", height: 300 }}
          />

          {/* リアルタイムランキング */}
          <div className="bg-gray-800 text-white rounded-lg p-4 w-full shadow-lg">
            <h4 className="font-bold mb-3 text-center">リアルタイムランキング</h4>
            <ul>
              {[
                { name: "あなたの損益", profit: totalProfit + unrealizedPL },
                { name: "日経平均を毎月積立した場合の損益", profit: latestNikkeiProfit }
              ]
              .sort((a, b) => b.profit - a.profit)
              .map((item, index) => (
                <li
                  key={item.name}
                  className="flex justify-between border-b border-gray-600 py-2 text-sm"
                >
                  <span>{index + 1}位: {item.name}</span>
                  <span className={item.profit >= 0 ? "text-green-300" : "text-red-300"}>
                    {item.profit.toLocaleString()}円
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 右：ニュース + コントロール */}
        <div className="flex flex-col w-72 space-y-4">

          {/* ニュース */}
          <div className="rounded-lg p-4 shadow-lg"
               style={{
                 background: "linear-gradient(135deg, #1f2937 0%, #374151 100%)",
                 height: 300
               }}>
            <h3 className="font-bold mb-2">今月のニュース</h3>
            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-lg border-t border-yellow-400 pt-2">
                ゴールデンクロス&デッドクロス情報
              </h4>
              {latestCross ? (
                <div className="text-white text-xl p-2 rounded shadow">
                  {latestCross.message}
                </div>
              ) : (
                <p className="text-xs text-gray-400">まだ発生していません。</p>
              )}
            </div>
          </div>

          {/* コントロールパネル */}
          <div className="rounded-lg p-4 shadow-lg flex flex-col justify-between"
               style={{
                 background: "linear-gradient(135deg, #1f2937 0%, #374151 100%)",
                 height: 300
               }}>
            <div className="space-y-1 text-sm">
              株価: <span className="text-yellow-300">{currentPrice.toLocaleString()}円</span><br />
              損益: <span className="text-red-400">{(totalProfit + unrealizedPL).toLocaleString()}円</span><br />
              現金: <span className="text-green-300">{capital.toLocaleString()}円</span><br />
              株数: {holding}株
            </div>

            <div className="flex justify-between mt-2">
              <button onClick={() => adjustQty(-100)} className="bg-black w-8 h-8 rounded-full">−</button>
              <span>{quantity}株</span>
              <button onClick={() => adjustQty(100)} className="bg-yellow-400 w-8 h-8 rounded-full text-black">＋</button>
            </div>

            <div className="flex justify-between mt-2">
              <button onClick={buyStock} className="bg-red-500 px-2 py-1 rounded text-sm">購入</button>
              <button onClick={sellStock} className="bg-green-500 px-2 py-1 rounded text-sm">売却</button>
            </div>

            <div className="flex justify-center mt-2">
              <button onClick={() => setIsPlaying(!isPlaying)} className="bg-blue-500 px-4 py-1 rounded text-sm">
                {isPlaying ? "⏸ Stop" : "▶ Start"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}