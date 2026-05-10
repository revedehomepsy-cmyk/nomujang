"use client";

import { useEffect, useState } from "react";
import { formatKRW } from "@/lib/tax";

interface Project { id: string; name: string }
interface WorkType { id: string; name: string }
interface Unit {
  id: string;
  date: string;
  units: number;
  unitPrice: number;
  totalCost: number;
  project: { name: string };
  workType: { name: string };
  notes: string | null;
}

function todayStr() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function thisMonth() {
  return todayStr().slice(0, 7);
}

export default function WorkUnitsClient({ projects, workTypes }: { projects: Project[]; workTypes: WorkType[] }) {
  const [yearMonth, setYearMonth] = useState(thisMonth());
  const [units, setUnits] = useState<Unit[]>([]);
  const [form, setForm] = useState({
    date: todayStr(),
    projectId: projects[0]?.id ?? "",
    workTypeId: workTypes[0]?.id ?? "",
    units: 1,
    unitPrice: 200000,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch(`/api/work-units?yearMonth=${yearMonth}&mine=true`);
    if (res.ok) setUnits(await res.json());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearMonth]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setSubmitting(true);
    const totalCost = Number(form.units) * Number(form.unitPrice);
    const res = await fetch("/api/work-units", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        date: form.date,
        projectId: form.projectId,
        workTypeId: form.workTypeId,
        units: Number(form.units),
        unitPrice: Number(form.unitPrice),
        totalCost,
        notes: form.notes,
      }),
    });
    setSubmitting(false);
    if (!res.ok) { setMsg("저장 실패"); return; }
    setForm({ ...form, units: 1, notes: "" });
    setMsg("저장 완료");
    load();
  }

  async function remove(id: string) {
    if (!confirm("삭제하시겠습니까?")) return;
    await fetch(`/api/work-units/${id}`, { method: "DELETE" });
    load();
  }

  const totalUnits = units.reduce((s, u) => s + u.units, 0);
  const totalCost = units.reduce((s, u) => s + u.totalCost, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">품수 / 비용 입력</h1>

      <form onSubmit={submit} className="card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">날짜</label>
            <input className="input" type="date" required value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">현장</label>
            <select className="input" value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">공정</label>
            <select className="input" value={form.workTypeId}
              onChange={(e) => setForm({ ...form, workTypeId: e.target.value })}>
              {workTypes.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">총 품수</label>
            <input className="input" type="number" step="0.5" min={0} value={form.units}
              onChange={(e) => setForm({ ...form, units: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">품당 단가 (원)</label>
            <input className="input" type="number" min={0} value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">총 비용</label>
            <div className="input bg-slate-50">{formatKRW(form.units * form.unitPrice)} 원</div>
          </div>
          <div className="sm:col-span-2">
            <label className="label">비고</label>
            <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end">
          <button className="btn-primary" disabled={submitting}>저장</button>
        </div>
        {msg && <div className="text-sm text-center text-brand">{msg}</div>}
      </form>

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <input className="input max-w-[160px]" type="month" value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)} />
          <div className="text-sm text-slate-500">
            {yearMonth} · 총 {totalUnits} 품 · {formatKRW(totalCost)} 원
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>날짜</th>
                <th>현장</th>
                <th>공정</th>
                <th>품수</th>
                <th>단가</th>
                <th>총액</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {units.length === 0 && (
                <tr><td colSpan={7} className="text-center text-slate-400 py-6">기록 없음</td></tr>
              )}
              {units.map((u) => (
                <tr key={u.id}>
                  <td>{u.date.slice(0, 10)}</td>
                  <td>{u.project.name}</td>
                  <td>{u.workType.name}</td>
                  <td>{u.units}</td>
                  <td>{formatKRW(u.unitPrice)}</td>
                  <td className="font-semibold">{formatKRW(u.totalCost)}</td>
                  <td>
                    <button onClick={() => remove(u.id)} className="text-xs text-red-500 hover:underline">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
