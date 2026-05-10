"use client";

import { useEffect, useState } from "react";

interface Project { id: string; name: string }
interface Attendance {
  id: string;
  type: string;
  photoData: string;
  capturedAt: string;
  user: { name: string; email: string };
  project: { name: string };
}

function todayStr() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export default function AttendanceClient({ projects }: { projects: Project[] }) {
  const [date, setDate] = useState(todayStr());
  const [projectId, setProjectId] = useState("all");
  const [items, setItems] = useState<Attendance[]>([]);
  const [preview, setPreview] = useState<Attendance | null>(null);

  async function load() {
    const params = new URLSearchParams({ date });
    if (projectId !== "all") params.set("projectId", projectId);
    const res = await fetch(`/api/attendance?${params.toString()}`);
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, projectId]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">출퇴근 기록</h1>
      <div className="card grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">날짜</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label">프로젝트</label>
          <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="all">전체</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.length === 0 && (
          <div className="col-span-full text-center text-slate-400 py-8 card">기록 없음</div>
        )}
        {items.map((a) => (
          <button key={a.id} onClick={() => setPreview(a)} className="card text-left hover:shadow transition">
            <div className="aspect-square w-full bg-slate-100 rounded-lg overflow-hidden mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.photoData} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="text-sm font-semibold">{a.user.name}</div>
            <div className="text-xs text-slate-500">{a.project.name}</div>
            <div className="flex items-center justify-between mt-1">
              <span className={`text-xs px-2 py-0.5 rounded ${
                a.type === "CHECK_IN" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
              }`}>
                {a.type === "CHECK_IN" ? "출근" : "퇴근"}
              </span>
              <span className="text-xs text-slate-500">
                {new Date(a.capturedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </button>
        ))}
      </div>

      {preview && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="bg-white rounded-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.photoData} alt="" className="w-full rounded-t-xl" />
            <div className="p-4">
              <div className="text-lg font-semibold">{preview.user.name}</div>
              <div className="text-sm text-slate-500">{preview.project.name} · {preview.type === "CHECK_IN" ? "출근" : "퇴근"}</div>
              <div className="text-sm text-slate-500">{new Date(preview.capturedAt).toLocaleString("ko-KR")}</div>
              <button onClick={() => setPreview(null)} className="btn-secondary w-full mt-3">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
