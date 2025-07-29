import React, { useState } from "react";

export default function HowToPlay({ onClose }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "遊び方①",
      content: [
        "このゲームは1年分の株価の値動きをスピーディに体験できるゲームです。",
        "１秒で1日分の株価が更新されます。",
        "購入数量を決めたら購入ボタンを押してください。"
      ],
    },
    {
      title: "遊び方②",
      content: [
        "購入後、株価が値上がりして利益が出たら売却して利益を確定してください。",
        "価格変動はニュースとチャートで確認できます。",
      ],
    },
    {
      title: "遊び方③",
      content: [
        "ゴールデンクロス/デッドクロスなどのテクニカル指標も表示されます。",
        "最終的な資産額がスコアになります。",
      ],
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep((prev) => prev + 1);
    } else {
      onClose(); // 最後のページで「はじめる」
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-3xl">
        <h2 className="text-xl font-bold mb-4">{steps[step].title}</h2>
        <ul className="list-disc pl-6 text-sm mb-4 space-y-2">
          {steps[step].content.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
        <button
          onClick={handleNext}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {step === steps.length - 1 ? "はじめる" : "次へ"}
        </button>
      </div>
    </div>
  );
}