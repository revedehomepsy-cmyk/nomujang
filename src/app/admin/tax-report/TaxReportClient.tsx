"use client";

import { useEffect, useState } from "react";
import { formatKRW } from "@/lib/tax";

interface Item {
  id?: string;
  foremanId?: string;
  foremanName: string;
  rrnLast7?: string | null;
  workDays: number;
  grossPay: number;
  incomeTax: number;
  localTax: number;
  pension: number;
  health: number;
  employment: number;
  industrial: number;
  netPay: number;
  edited?: boolean;
}

function thisMonth() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 7);
}

const TYPE_LABEL: Record<string, string> = {
  DAILY_LABOR: "일용직 신고",
  BUSINESS_INCOME: "사업소득 신고 (3.3%)",
};

export default function TaxReportClient() {
  const [yearMonth, setYearMonth] = useState(thisMonth());
  const [type, setType] = useState<"DAILY_LABOR" | "BUSINESS_INCOME">("DAILY_LABOR");
  const [recipient, setRecipient] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function generate() {
    setLoading(true);
    setMsg("");
    const res = await fetch(`/api/tax/preview?yearMonth=${yearMonth}&type=${type}`);
    if (res.ok) setItems(await res.json());
    else setMsg("미리보기를 불러오지 못했습니다.");
    setLoading(false);
  }

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearMonth, type]);

  function patch(idx: number, key: keyof Item, value: any) {
    const next = [...items];
    (next[idx] as any)[key] = value;
    next[idx].edited = true;
    // 자동 재계산: netPay = gross - (incomeTax + localTax + pension + health + employment)
    const it = next[idx];
    it.netPay =
      Number(it.grossPay || 0) -
      Number(it.incomeTax || 0) -
      Number(it.localTax || 0) -
      Number(it.pension || 0) -
      Number(it.health || 0) -
      Number(it.employment || 0);
    setItems(next);
  }

  async function send() {
    if (!recipient) { setMsg("세무사 이메일을 입력하세요."); return; }
    if (items.length === 0) { setMsg("발송할 항목이 없습니다."); return; }
    if (!confirm(`${TYPE_LABEL[type]} (${yearMonth}) 자료를 ${recipient} 으로 발송하시겠습니까?`)) return;
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/tax/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ yearMonth, type, recipient, items, notes }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error || "발송 실패");
      return;
    }
    const data = await res.json();
    setMsg(data.skipped ? "SMTP가 설정되지 않아 메일은 보내지 않고 자료만 저장했습니다." : "메일 발송 완료");
  }

  const totals = items.reduce(
    (s, i) => {
      s.grossPay += i.grossPay;
      s.incomeTax += i.incomeTax;
      s.localTax += i.localTax;
      s.pension += i.pension;
      s.health += i.health;
      s.employment += i.employment;
      s.netPay += i.netPay;
      return s;
    },
    { grossPay: 0, incomeTax: 0, localTax: 0, pension: 0, health: 0, employment: 0, netPay: 0 }
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">세무사 메일 발송</h1>
      <p className="text-sm text-slate-500">
        지급월 기준으로 일용직/사업소득 신고 자료를 자동 계산합니다. 표 안의 금액을 직접 수정한 뒤 세무사에게 발송하세요.
      </p>

      <div className="card grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="label">지급월</label>
          <input className="input" type="month" value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} />
        </div>
        <div>
          <label className="label">신고 종류</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="DAILY_LABOR">일용직 신고</option>
            <option value="BUSINESS_INCOME">사업소득 신고 (3.3%)</option>
          </select>
        </div>
        <div>
          <label className="label">세무사 이메일</label>
          <input className="input" type="email" value={recipient}
            onChange={(e) => setRecipient(e.target.value)} placeholder="tax@example.com" />
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full text-xs sm:text-sm">
          <thead>
            <tr>
              <th>반장</th>
              <th>주민(뒤7)</th>
              <th>근무일</th>
              <th>지급액</th>
              <th>소득세</th>
              <th>지방세</th>
              <th>국민연금</th>
              <th>건강</th>
              <th>고용</th>
              <th>실수령</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={10} className="text-center text-slate-400 py-6">계산 중...</td></tr>}
            {!loading && items.length === 0 && (
              <tr><td colSpan={10} className="text-center text-slate-400 py-6">데이터 없음</td></tr>
            )}
            {items.map((it, idx) => (
              <tr key={idx} className={it.edited ? "bg-amber-50" : ""}>
                <td className="font-medium">{it.foremanName}</td>
                <td>
                  <input className="input !py-1 !px-2 w-24" value={it.rrnLast7 ?? ""}
                    onChange={(e) => patch(idx, "rrnLast7", e.target.value)} />
                </td>
                <td>
                  <input className="input !py-1 !px-2 w-16" type="number" value={it.workDays}
                    onChange={(e) => patch(idx, "workDays", Number(e.target.value))} />
                </td>
                <td><Money v={it.grossPay} on={(v) => patch(idx, "grossPay", v)} /></td>
                <td><Money v={it.incomeTax} on={(v) => patch(idx, "incomeTax", v)} /></td>
                <td><Money v={it.localTax} on={(v) => patch(idx, "localTax", v)} /></td>
                <td><Money v={it.pension} on={(v) => patch(idx, "pension", v)} /></td>
                <td><Money v={it.health} on={(v) => patch(idx, "health", v)} /></td>
                <td><Money v={it.employment} on={(v) => patch(idx, "employment", v)} /></td>
                <td className="font-semibold whitespace-nowrap">{formatKRW(it.netPay)}</td>
              </tr>
            ))}
          </tbody>
          {items.length > 0 && (
            <tfoot>
              <tr className="font-semibold bg-slate-50">
                <td colSpan={3} className="text-right">합계</td>
                <td>{formatKRW(totals.grossPay)}</td>
                <td>{formatKRW(totals.incomeTax)}</td>
                <td>{formatKRW(totals.localTax)}</td>
                <td>{formatKRW(totals.pension)}</td>
                <td>{formatKRW(totals.health)}</td>
                <td>{formatKRW(totals.employment)}</td>
                <td>{formatKRW(totals.netPay)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="card">
        <label className="label">메일 본문에 포함할 메모</label>
        <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex items-center justify-between mt-3">
          <button onClick={generate} className="btn-secondary">자동 재계산</button>
          <button onClick={send} disabled={loading} className="btn-primary">
            {loading ? "처리 중..." : "세무사에게 메일 발송"}
          </button>
        </div>
        {msg && <div className="text-sm text-center text-brand mt-2">{msg}</div>}
      </div>
    </div>
  );
}

function Money({ v, on }: { v: number; on: (v: number) => void }) {
  return (
    <input
      className="input !py-1 !px-2 w-24 text-right"
      type="number"
      value={v}
      onChange={(e) => on(Number(e.target.value))}
    />
  );
}
