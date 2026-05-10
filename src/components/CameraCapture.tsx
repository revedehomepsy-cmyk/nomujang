"use client";

import { useEffect, useRef, useState } from "react";

export default function CameraCapture({
  onCapture,
}: {
  onCapture: (dataUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string>("");
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("user");

  useEffect(() => {
    let cancelled = false;
    async function start() {
      setError("");
      setReady(false);
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (e: any) {
        setError("카메라 권한이 필요합니다. 브라우저 설정을 확인해주세요.");
      }
    }
    start();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [facing]);

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    onCapture(dataUrl);
  }

  return (
    <div className="space-y-3">
      <div className="aspect-[3/4] w-full bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
        {error ? (
          <div className="text-white text-sm p-4 text-center">{error}</div>
        ) : (
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFacing(facing === "user" ? "environment" : "user")}
          className="btn-secondary flex-1"
        >
          카메라 전환
        </button>
        <button type="button" onClick={capture} disabled={!ready} className="btn-primary flex-1">
          사진 촬영
        </button>
      </div>
    </div>
  );
}
