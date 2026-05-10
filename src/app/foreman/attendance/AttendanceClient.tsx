"use client";

import { useEffect, useState } from "react";
import CameraCapture from "@/components/CameraCapture";

interface Project { id: string; name: string }
interface Att {
  id: string;
  type: string;
  capturedAt: string;
  photoData: string;
  project: { name: string };
}

export default function AttendanceClient({ projects }: { projects: Project[] }) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [type, setType] = useState<"CHECK_IN" | "CHECK_OUT">("CHECK_IN");
  const [photo, setPhoto] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [history, setHistory] = useState<Att[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  async function loadHistory() {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    const date = today.toISOString().slice(0, 10);
    const res = await fetch(`/api/attendance?date=${date}`);
    if (res.ok) {
      const data = await res.json();
      setHistory(data);
      const hasCheckIn = data.some((a: Att) => a.type === "CHECK_IN");
      setType(hasCheckIn ? "CHECK_OUT" : "CHECK_IN");
    }
  }

  useEffect(() => {
    loadHistory();
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords(null),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  async function submit() {
    if (!projectId) { setMsg("프로젝트를 선택하세요."); return; }
    if (!photo) { setMsg("사진을 먼저 촬영하세요."); return; }
    setSubmitting(true);
    setMsg("");
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectId,
        type,
        photoData: photo,
        latitude: coords?.lat,
        longitude: coords?.lng,
      }),
    });
    setSubmitting(false);
    if (!res.ok) { setMsg("저장 실패"); return; }
    setPhoto(null);
    setMsg(type === "CHECK_IN" ? "출근 기록 완료" : "퇴근 기록 완료");
    loadHistory();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">출퇴근 사진</h1>
      <div className="card space-y-3">
        <div>
          <label className="label">현장</label>
          <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.length === 0 && <option value="">현장이 없습니다</option>}
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">구분</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("CHECK_IN")}
              className={`flex-1 btn ${type === "CHECK_IN" ? "bg-brand text-white" : "bg-slate-100 text-slate-700"}`}
            >
              출근
            </button>
            <button
              type="button"
              onClick={() => setType("CHECK_OUT")}
              className={`flex-1 btn ${type === "CHECK_OUT" ? "bg-brand text-white" : "bg-slate-100 text-slate-700"}`}
            >
              퇴근
            </button>
          </div>
        </div>

        {photo ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="capture" className="w-full rounded-xl" />
            <div className="flex gap-2">
              <button onClick={() => setPhoto(null)} className="btn-secondary flex-1">다시 찍기</button>
              <button onClick={submit} disabled={submitting} className="btn-primary flex-1">
                {submitting ? "저장 중..." : "기록 저장"}
              </button>
            </div>
          </div>
        ) : (
          <CameraCapture onCapture={setPhoto} />
        )}
        {msg && <div className="text-sm text-center text-brand">{msg}</div>}
      </div>

      <div className="card">
        <div className="font-semibold mb-2">오늘 기록</div>
        {history.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-4">기록 없음</div>
        ) : (
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h.id} className="flex items-center gap-3 border-b last:border-0 pb-2 last:pb-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={h.photoData} alt="" className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {h.type === "CHECK_IN" ? "출근" : "퇴근"} · {h.project.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(h.capturedAt).toLocaleString("ko-KR")}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
