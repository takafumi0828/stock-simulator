import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import Papa from "papaparse";

export default function App() {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const intervalRef = useRef(null);

  const [stockData, setStockData] = useState([]);
  const [dayIndex, setDayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [company, setCompany] = useState("トヨタ");

  const [capital, setCapital] = useState(10_000_000);
  const [holding, setHolding] = useState(0);
  const [avgPrice, setAvgPrice] = useState(0);
  const [quantity, setQuantity] = useState(100);
  const [totalProfit, setTotalProfit] = useState(0);

  // 2023年8月～の日付で架空ニュース（例）
  const newsData = {
  "2023-08-01": "トヨタ、次世代電動車の新技術を発表 — 充電時間を大幅短縮し競争力強化へ。トヨタは本日、新開発の次世代バッテリー技術を公開。充電時間が従来の半分に短縮される見込みで、今後の電動車市場でのシェア拡大に期待が高まった。",
  "2023-09-03": "トヨタ、インド市場で新工場建設を正式決定 — さらなる市場拡大目指す。トヨタはインドに最新鋭の生産工場を建設すると発表。今後数年間で現地の需要増加に対応し、コスト削減も見込む戦略で投資家の注目を集めている。",
  "2024-02-05": "トヨタ、米国での自動運転車試験を拡大 — 技術提携も発表。トヨタは米国における自動運転車の公道試験を拡大するとともに、大手IT企業との技術提携を発表。自動運転技術の先行者利益期待で市場は好反応を示し、株価が大幅に上昇した。",
  "2024-02-06": "トヨタ、AI搭載車の新モデルを発表 — 革新的な安全機能で注目。トヨタはAIによる高度な運転支援機能を搭載した新モデルを発表。安全性の大幅な向上が期待され、業界内外で大きな話題となっている。",
  "2024-02-28": "トヨタ、新型SUVが欧州市場で好評 — 受注数が目標の150%に。欧州市場で発売されたトヨタの新型SUVが予想を超える受注を獲得。環境性能と走行性能の高さが評価されており、今後の売上拡大に期待が寄せられている。",
  "2024-03-31": "トヨタ、中国市場での販売減速を発表 — 貿易摩擦が影響。トヨタは中国市場での新車販売が前期比で減少したと発表。米中貿易摩擦の影響や現地競合他社の台頭が響いているとされ、投資家心理が悪化し株価が急落した。",
  "2024-06-24": "トヨタ、次世代水素燃料電池車の量産計画を正式発表。トヨタは新たな水素燃料電池車の量産計画を発表。環境規制強化への対応と新市場開拓を狙い、今後の成長戦略として注目されている。これを受けて株価は上昇した。",
  "2024-07-17": "トヨタ、一部工場での生産遅延を報告 — 部品供給に問題。主要部品の供給遅延により、一部工場での生産が遅れているとトヨタが発表。世界的なサプライチェーン問題の影響が続いており、業績懸念から株価が大幅に下落した。",
};

  const fetchStockDataFromCSV = async (symbol = "トヨタ") => {
    const response = await fetch("/stock_2symbols_2y_ohlc.csv");
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
      height: 400,
      layout: {
        backgroundColor: "#000000", // より黒い背景
        textColor: "#CCCCCC", // 軸やテキストを読みやすい色に
      },
      grid: {
        vertLines: { color: "#1a1a1a" }, // 黒に馴染むグリッド線
        horzLines: { color: "#1a1a1a" },
      },
      crossHair: { mode: 1 },
      timeScale: {
        timeVisible: true,
        barSpacing: 15,
        fixRightEdge: true,
        rightOffset: 3,
        tickMarkFormatter: (time) => {
          const date = new Date(time * 1000);
          return `${date.getMonth() + 1}月`;
        },
        borderVisible: true,
        ticksVisible: true,
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

    series.setData(stockData.slice(0, dayIndex + 1));
    chart.timeScale().fitContent();

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
            seriesRef.current.setData(stockData.slice(0, next + 1));
            chartRef.current.timeScale().fitContent();
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

// 最新のニュース日を覚えておくためのstateを用意
const [lastNewsDate, setLastNewsDate] = useState(null);

useEffect(() => {
  if (!currentDateStr) return;

  if (newsData[currentDateStr]) {
    // 直前に停止したニュース日と同じならスキップしない（必ず停止したいので）
    if (lastNewsDate !== currentDateStr) {
      setIsPlaying(false);
      setLastNewsDate(currentDateStr);

      const timer = setTimeout(() => {
        setIsPlaying(true);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }
}, [currentDateStr]);


  // ニュース履歴（現在の日付までのニュース一覧）
  const newsHistory = Object.entries(newsData)
    .filter(([date]) => currentDateStr && date <= currentDateStr)
    .sort(([a], [b]) => (a < b ? -1 : 1));

  return (
    <div className="p-4 bg-gradient-to-b from-blue-900 to-blue-700 text-white font-sans min-h-screen flex flex-col items-center">
      <h2 className="text-lg mb-4">投資体験シミュレーター</h2>

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

      <div className="text-right w-full max-w-3xl text-base font-bold mb-2">
        累計損益：{" "}
        <span className="text-red-400">
          {(totalProfit + unrealizedPL).toLocaleString()}円
        </span>
      </div>

      <div className="text-sm mb-2">
        現在の日付：{currentDateStr || "—"}　
        株価：{currentPrice?.toLocaleString() ?? "—"}円
      </div>

      <div className="flex max-w-5xl w-full space-x-4">
        <div
          ref={chartContainerRef}
          className="bg-[#121212] rounded-lg shadow flex-1"
          style={{ height: 400 }}
        />
        <div
          className="w-72 rounded-lg p-4 shadow-lg flex flex-col justify-center overflow-y-auto"
          style={{
            background:
              "linear-gradient(135deg, #1f2937 0%, #374151 100%)",
            color: "#e0e7ff",
            boxShadow:
              "0 4px 12px rgba(67, 56, 202, 0.5), 0 2px 4px rgba(0,0,0,0.2)",
            maxHeight: 400,
          }}
        >
          <h3 className="font-bold mb-2 text-lg border-b border-indigo-400 pb-2">
            ニュース（{currentDateStr || "—"}）
          </h3>
          <p className="text-sm leading-relaxed mb-4">
            {currentDateStr && newsData[currentDateStr]
              ? newsData[currentDateStr]
              : "該当ニュースはありません。"}
          </p>

          <h4 className="font-semibold mt-4 mb-2 border-t border-indigo-400 pt-2">
            過去のニュース履歴
          </h4>
          <ul className="text-xs space-y-2 max-h-56 overflow-y-auto">
            {newsHistory.length === 0 && <li>ニュース履歴はありません。</li>}
            {newsHistory.map(([date, text]) => (
              <li key={date}>
                <span className="font-mono text-indigo-300">{date}</span> : {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="text-lg font-bold mt-6 mb-4">
        現在の株価{" "}
        <span className="text-yellow-300">{currentPrice.toLocaleString()}円</span>
      </div>

      <div className="flex items-center justify-center mb-4 space-x-4">
        <button
          onClick={() => adjustQty(-100)}
          className="bg-black rounded-full w-10 h-10 text-white text-lg"
        >
          −
        </button>
        <span className="text-xl">{quantity} 株</span>
        <button
          onClick={() => adjustQty(100)}
          className="bg-yellow-400 text-black rounded-full w-10 h-10 text-lg"
        >
          ＋
        </button>
      </div>

      <div className="text-sm w-full max-w-3xl mb-4">
        <p>
          保有現金：<span className="text-green-300">{capital.toLocaleString()}円</span>
        </p>
        <p>
          保有株数：{holding} 株（平均取得単価 {avgPrice.toLocaleString()}円）
        </p>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={buyStock}
          className="bg-red-500 text-white text-lg font-bold px-6 py-2 rounded-full shadow-lg"
        >
          購入する
        </button>
        <button
          onClick={sellStock}
          className="bg-green-500 text-white text-lg font-bold px-6 py-2 rounded-full shadow-lg"
        >
          売却する
        </button>
      </div>

      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="bg-blue-500 text-white px-4 py-2 rounded text-lg"
      >
        {isPlaying ? "⏸ Stop" : "▶ Start"}
      </button>
    </div>
  );
}
