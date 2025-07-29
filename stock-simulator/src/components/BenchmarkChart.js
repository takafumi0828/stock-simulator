import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export default function BenchmarkChart({ yourPnlData, dayIndex, nikkeiPnL, }) {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const yourPnSeriesRef = useRef();
  const nikkeiSeriesRef = useRef();

  // チャート初期化
  useEffect(() => {
    if (!chartRef.current) {
      chartRef.current = createChart(chartContainerRef.current, {
        width: 600,
        height: 300,
        layout: {
          background: { type: 'solid', color: '#000000' },
          textColor: '#FFFFFF',
        },
        grid: {
          vertLines: { color: '#444' },
          horzLines: { color: '#444' },
        },
        rightPriceScale: {
          borderColor: '#71649C',
        },
        timeScale: {
          borderColor: '#71649C',
        },
      });

      yourPnSeriesRef.current = chartRef.current.addLineSeries({
        color: 'cyan',
        lineWidth: 2,
      });

      nikkeiSeriesRef.current = chartRef.current.addLineSeries({
        color: 'orange',
        lineWidth: 2,
      });
    }
  }, []);

  // あなたの損益データ反映
  useEffect(() => {
    if (yourPnlData && yourPnSeriesRef.current && dayIndex >= 0) {
      yourPnSeriesRef.current.setData(yourPnlData.slice(0, dayIndex + 1));
    }
  }, [yourPnlData, dayIndex]);

 // 日経平均の損益
useEffect(() => {
  if (nikkeiPnL && nikkeiPnL.length > 0 && nikkeiSeriesRef.current && dayIndex >= 0) {
    const formatted = nikkeiPnL.map(d => ({
      time: Math.floor(d.date.getTime() / 1000), // UNIX秒に変換
      value: d.profit,
    }));
    nikkeiSeriesRef.current.setData(formatted.slice(0, dayIndex + 1));
  }
}, [nikkeiPnL, dayIndex]);

  return (
    <div className="mt-4">
      <h4 className="text-white font-bold mb-2">あなた vs 日経平均</h4>
      <div ref={chartContainerRef} />
    </div>
  );
}