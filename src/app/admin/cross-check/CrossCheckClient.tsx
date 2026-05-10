"use client";

import { useEffect, useState } from "react";
import { formatKRW } from "@/lib/tax";

interface Project { id: string; name: string }

interface Row {
  date: string;
  project: string;
  workType: string;
  foremanName: string;
  workerCount: number; // 현장소장 입력
  units: number; // 반장 입력 품수
  totalCost: number; // 반장 입력 비용
  diff: number; // workerCount - units
  match: boolean;
}

function thisMonth() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 7);
}

export default function CrossCheckClient({ projects }: { projects: Project[] }) {
  const [yearMonth, setYearMonth] = useState(thisMonth());
  const [projectId, setProjectId] = useState("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ yearMonth });
    if (projectId !== "all") params.set("projectId", projectId);
    const res = await fetch(`/api/cross-check?${params.toString()}`);
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearMonth, projectId]);

  const totalWorkers = rows.reduce((s, r) => s + r.workerCount, 0);
  const totalUnits = rows.reduce((s, r) => s + r.units, 0);
  const totalCost = rows.reduce((s, r) => s + r.totalCost, 0);
  const mismatchCount = rows.filter((r) => !r.match).length;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">품수 크로스 체크</h1>
      <p className="text-sm text-slate-500">
        현장소장이 입력한 일일 작업자 수와 반장(팀장)이 입력한 품수를 동일 기준(날짜·현장·공정·반장)으로 비교합니다.
      </p>
      <div className="card grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">월</label>
          <input className="input" type="month" value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} />
        </div>
        <div>
          <label className="label">프로젝트</label>
          <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="all">전체</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="총 작업자(현장소장)" value={`${totalWorkers}명`} />
        <Stat label="총 품수(반장)" value={`${totalUnits}`} />
        <Stat label="총 비용" value={`${formatKRW(totalCost)}원`} />
        <Stat label="불일치" value={`${mismatchCount}건`} highlight={mismatchCount > 0} />
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>날짜</th>
              <th>현장</th>
              <th>공정</th>
              <th>반장</th>
              <th>작업자(소장)</th>
              <th>품수(반장)</th>
              <th>차이</th>
              <th>비용</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="text-center text-slate-400 py-6">불러오는 중...</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={8} className="text-center text-slate-400 py-6">데이터 없음</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={i} className={r.match ? "" : "bg-amber-50"}>
                <td>{r.date.slice(0, 10)}</td>
                <td>{r.project}</td>
                <td>{r.workType}</td>
                <td>{r.foremanName}</td>
                <td>{r.workerCount}</td>
                <td>{r.units}</td>
                <td className={r.match ? "text-slate-400" : "text-amber-600 font-semibold"}>
                  {r.diff > 0 ? `+${r.diff}` : r.diff}
                </td>
                <td>{formatKRW(r.totalCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="card">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${highlight ? "text-amber-600" : ""}`}>{value}</div>
    </div>
  );
}
