import React, { useState } from "react";

export default function HowToPlay({ onClose }) {
  const [step, setStep] = useState(0);

  const steps = [
  {
    title: "遊び方①",
    content: [
      "このゲームは1年分の株価の値動きをスピーディに体験できるゲームです。",
      "１秒で1日分の株価が更新されます。",
      "購入数量を決めたら好きなタイミングで購入ボタンを押してください。",
      "Startボタンで初めて、Stopボタンで進行を中断できます。"
    ],
    image: `${process.env.PUBLIC_URL}/images/howto1.png` // GitHub Pages対応
  },
  {
    title: "遊び方②",
    content: [
      "購入後、株価が値上がりして利益が出たら売却して利益を確定してください。",
      "売買のヒントとして、価格変動につながるニュースとゴールデンクロス/デッドクロスなどのテクニカル指標も表示されます。"
    ],
    image: `${process.env.PUBLIC_URL}/images/howto2.png`
  },
  {
    title: "遊び方③",
    content: [
      "株式投資は一般的に長期分散投資が有効とされており、日経平均に連動する商品を毎月積立した場合の損益とプレイヤーの損益がリアルタイムでランキング形式で表示されます",
      "最終的な損益がスコアとなります。"
    ],
    image: `${process.env.PUBLIC_URL}/images/howto3.png`
  }
];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      {/* 背景色を白からブルー系に変更 */}
      <div
        className="p-6 rounded-xl w-full max-w-3xl text-white"
        style={{
          background: "linear-gradient(135deg, #1e3a8a, #2563eb)" // 青系グラデーション
        }}
      >
        <h2 className="text-xl font-bold mb-4">{steps[step].title}</h2>
            <ul className="list-disc pl-6 text-sm mb-4 space-y-2">
          {steps[step].content.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>

        {/* 画像表示 */}
        {steps[step].image && (
        <div className="flex justify-center mb-4">
          <img
            src={steps[step].image}
            alt={steps[step].title}
        className={
          step === steps.length - 1
            ? "" // 最後の画像はクラスなし（元サイズそのまま）
            : "w-2/3 max-w-md object-contain rounded-lg shadow-lg" // 通常サイズ
        }
    />
  </div>
)}


        <div className="flex justify-end">
          <button
            onClick={handleNext}
            className="bg-yellow-400 text-black px-4 py-2 rounded font-bold"
          >
            {step === steps.length - 1 ? "はじめる" : "次へ"}
          </button>
        </div>
      </div>
    </div>
  );
}
