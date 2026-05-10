"use client";

import { useEffect, useState } from "react";

interface Project { id: string; name: string }
interface WorkType { id: string; name: string }
interface DailyLog {
  id: string;
  date: string;
  projectId: string;
  project: { name: string };
  workTypeId: string;
  workType: { name: string };
  foremanName: string;
  workerCount: number;
  notes: string | null;
}

function todayStr() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export default function DailyClient({ projects, workTypes }: { projects: Project[]; workTypes: WorkType[] }) {
  const [date, setDate] = useState(todayStr());
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [filter, setFilter] = useState({ projectId: "all" });
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [form, setForm] = useState({
    workTypeId: workTypes[0]?.id ?? "",
    foremanName: "",
    workerCount: 1,
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const params = new URLSearchParams({ date });
    if (filter.projectId !== "all") params.set("projectId", filter.projectId);
    const res = await fetch(`/api/daily-logs?${params.toString()}`);
    if (res.ok) setLogs(await res.json());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, filter.projectId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!projectId) { setError("프로젝트를 선택하세요."); return; }
    if (!form.workTypeId) { setError("공정을 선택하세요."); return; }
    if (!form.foremanName.trim()) { setError("반장님 이름을 입력하세요."); return; }
    setSaving(true);
    const res = await fetch("/api/daily-logs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        date,
        projectId,
        workTypeId: form.workTypeId,
        foremanName: form.foremanName.trim(),
        workerCount: Number(form.workerCount),
        notes: form.notes,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("저장 실패");
      return;
    }
    setForm({ ...form, foremanName: "", workerCount: 1, notes: "" });
    load();
  }

  async function remove(id: string) {
    if (!confirm("삭제하시겠습니까?")) return;
    const res = await fetch(`/api/daily-logs/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  const totalWorkers = logs.reduce((s, l) => s + l.workerCount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">일일 작업 입력</h1>
      </div>

      <form onSubmit={add} className="card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">날짜</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">프로젝트</label>
            <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              {projects.length === 0 && <option value="">프로젝트를 먼저 등록하세요</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">공정</label>
            <select
              className="input"
              value={form.workTypeId}
              onChange={(e) => setForm({ ...form, workTypeId: e.target.value })}
            >
              {workTypes.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">반장님 이름</label>
            <input
              className="input"
              value={form.foremanName}
              onChange={(e) => setForm({ ...form, foremanName: e.target.value })}
              placeholder="예: 김반장"
            />
          </div>
          <div>
            <label className="label">총 작업자 수</label>
            <input
              className="input"
              type="number"
              min={1}
              value={form.workerCount}
              onChange={(e) => setForm({ ...form, workerCount: Number(e.target.value) })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">비고</label>
            <input
              className="input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex justify-end">
          <button className="btn-primary" disabled={saving}>
            {saving ? "저장 중..." : "추가"}
          </button>
        </div>
      </form>

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-slate-500">
            {date} 기록 — 총 작업자 <b>{totalWorkers}명</b>
          </div>
          <select
            className="input max-w-[200px]"
            value={filter.projectId}
            onChange={(e) => setFilter({ projectId: e.target.value })}
          >
            <option value="all">모든 프로젝트</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>프로젝트</th>
                <th>공정</th>
                <th>반장님</th>
                <th>작업자</th>
                <th>비고</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={6} className="text-center text-slate-400 py-6">기록 없음</td></tr>
              )}
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{l.project.name}</td>
                  <td>{l.workType.name}</td>
                  <td>{l.foremanName}</td>
                  <td>{l.workerCount}명</td>
                  <td className="text-slate-500">{l.notes || "-"}</td>
                  <td>
                    <button onClick={() => remove(l.id)} className="text-xs text-red-500 hover:underline">
                      삭제
                    </button>
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
