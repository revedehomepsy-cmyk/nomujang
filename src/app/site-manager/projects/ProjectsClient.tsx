"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  address: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
}

export default function ProjectsClient({ initialProjects }: { initialProjects: Project[] }) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", startDate: "", endDate: "" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const project = await res.json();
      setProjects([project, ...projects]);
      setForm({ name: "", address: "", startDate: "", endDate: "" });
      setAdding(false);
      router.refresh();
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setProjects(projects.map((p) => (p.id === id ? { ...p, isActive: !isActive } : p)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">프로젝트</h1>
        <button className="btn-primary" onClick={() => setAdding(!adding)}>
          {adding ? "취소" : "+ 새 프로젝트"}
        </button>
      </div>

      {adding && (
        <form onSubmit={add} className="card grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label">프로젝트명</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">주소</label>
            <input
              className="input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <label className="label">착공일</label>
            <input
              className="input"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label">준공일</label>
            <input
              className="input"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2 flex gap-2 justify-end">
            <button type="button" className="btn-secondary" onClick={() => setAdding(false)}>
              취소
            </button>
            <button className="btn-primary">등록</button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>프로젝트명</th>
              <th>주소</th>
              <th>기간</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-slate-400 py-6">
                  등록된 프로젝트가 없습니다.
                </td>
              </tr>
            )}
            {projects.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">{p.name}</td>
                <td className="text-slate-500">{p.address || "-"}</td>
                <td className="text-slate-500">
                  {p.startDate ? p.startDate.slice(0, 10) : "-"} ~ {p.endDate ? p.endDate.slice(0, 10) : "-"}
                </td>
                <td>
                  <button
                    onClick={() => toggleActive(p.id, p.isActive)}
                    className={`text-xs px-2 py-1 rounded ${
                      p.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {p.isActive ? "진행중" : "종료"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
