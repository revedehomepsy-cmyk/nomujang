"use client";

import { useMemo, useState } from "react";
import { calcBusinessIncome, calcDailyLabor, formatKRW, type TaxRates } from "@/lib/tax";

export default function TaxClient({ defaultRates }: { defaultRates: TaxRates }) {
  const [rates, setRates] = useState<TaxRates>(defaultRates);
  const [grossPay, setGrossPay] = useState(3_000_000);
  const [workDays, setWorkDays] = useState(15);

  const result = useMemo(() => {
    const daily = calcDailyLabor({ grossPay, workDays }, rates);
    const business = calcBusinessIncome(grossPay, rates);
    return { daily, business };
  }, [rates, grossPay, workDays]);

  function rate(k: keyof TaxRates, v: number) {
    setRates({ ...rates, [k]: v });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">세금 / 보험료 비교</h1>
      <p className="text-sm text-slate-500">
        일용직 신고 vs 사업소득(3.3%) 신고 시 발생 세금/4대보험을 비교합니다. 세율은 직접 수정 가능합니다.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card space-y-3">
          <h2 className="font-semibold">입력</h2>
          <div>
            <label className="label">총 지급액 (월)</label>
            <input className="input" type="number" min={0} value={grossPay}
              onChange={(e) => setGrossPay(Number(e.target.value))} />
            <div className="text-xs text-slate-500 mt-1">{formatKRW(grossPay)} 원</div>
          </div>
          <div>
            <label className="label">근무일수</label>
            <input className="input" type="number" min={0} value={workDays}
              onChange={(e) => setWorkDays(Number(e.target.value))} />
          </div>
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold">세율 / 요율</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <RateInput label="일 공제(원)" value={rates.dailyDeduction} onChange={(v) => rate("dailyDeduction", v)} />
            <RateInput label="일용직 소득세율" value={rates.dailyIncomeTaxRate} step={0.001} onChange={(v) => rate("dailyIncomeTaxRate", v)} />
            <RateInput label="지방세 (소득세 대비)" value={rates.localTaxRate} step={0.01} onChange={(v) => rate("localTaxRate", v)} />
            <RateInput label="국민연금율" value={rates.pensionRate} step={0.001} onChange={(v) => rate("pensionRate", v)} />
            <RateInput label="건강보험율" value={rates.healthRate} step={0.001} onChange={(v) => rate("healthRate", v)} />
            <RateInput label="고용보험율" value={rates.employmentRate} step={0.001} onChange={(v) => rate("employmentRate", v)} />
            <RateInput label="사업소득 원천징수율" value={rates.businessIncomeRate} step={0.001} onChange={(v) => rate("businessIncomeRate", v)} />
            <RateInput label="사업소득 지방세율" value={rates.businessLocalRate} step={0.001} onChange={(v) => rate("businessLocalRate", v)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ResultCard title="일용직 신고" result={result.daily} highlight={result.daily.netPay > result.business.netPay} />
        <ResultCard title="사업소득 신고 (3.3%)" result={result.business} highlight={result.business.netPay > result.daily.netPay} />
      </div>

      <div className="card">
        <div className="text-sm text-slate-600">
          실수령액 차이:{" "}
          <b className={result.daily.netPay > result.business.netPay ? "text-emerald-600" : "text-amber-600"}>
            {formatKRW(Math.abs(result.daily.netPay - result.business.netPay))} 원
          </b>{" "}
          ({result.daily.netPay > result.business.netPay ? "일용직이 유리" : "사업소득이 유리"})
        </div>
        <div className="text-xs text-slate-400 mt-1">
          * 표준 공식 기반 추정치입니다. 실제 신고는 세무사와 최종 확인 후 진행하세요.
        </div>
      </div>
    </div>
  );
}

function RateInput({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="text-sm">
      <span className="text-xs text-slate-500">{label}</span>
      <input className="input mt-1" type="number" step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function ResultCard({ title, result, highlight }: { title: string; result: ReturnType<typeof calcDailyLabor>; highlight: boolean }) {
  return (
    <div className={`card ${highlight ? "ring-2 ring-brand" : ""}`}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">{title}</h2>
        {highlight && <span className="text-xs px-2 py-0.5 rounded bg-brand text-white">실수령 유리</span>}
      </div>
      <Row label="총 지급액" value={result.grossPay} />
      <Row label="소득세" value={result.incomeTax} />
      <Row label="지방소득세" value={result.localTax} />
      <Row label="국민연금" value={result.pension} />
      <Row label="건강보험" value={result.health} />
      <Row label="고용보험" value={result.employment} />
      <Row label="공제 합계" value={result.totalDeduction} bold />
      <Row label="실수령액" value={result.netPay} highlight bold />
    </div>
  );
}

function Row({ label, value, bold, highlight }: { label: string; value: number; bold?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b last:border-0 text-sm">
      <span className={bold ? "font-semibold" : "text-slate-600"}>{label}</span>
      <span className={`${bold ? "font-semibold" : ""} ${highlight ? "text-brand text-lg" : ""}`}>
        {formatKRW(value)} 원
      </span>
    </div>
  );
}
