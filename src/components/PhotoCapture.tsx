import React, { useEffect, useRef, useState } from "react";
import { Camera, Upload, X, RotateCcw, Check, AlertTriangle } from "lucide-react";
import { compressImage, compressDataUrl } from "../utils/imageUtils";

interface PhotoCaptureProps {
  value: string;
  onChange: (dataUrl: string) => void;
  label: string;
  theme: any;
  facingMode?: "user" | "environment";
  height?: number;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  value, onChange, label, theme: t, facingMode = "environment", height = 128,
}) => {
  const mono = "var(--font-mono)";
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  };

  useEffect(() => stopStream, []);

  const openCamera = async () => {
    setSnapshot(null);
    setCameraError(null);
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 960 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError("Couldn't access the camera. Check permissions, or choose a photo from your device instead.");
    }
  };

  const closeCamera = () => {
    stopStream();
    setCameraOpen(false);
    setSnapshot(null);
    setCameraError(null);
  };

  const takeSnapshot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setSnapshot(canvas.toDataURL("image/jpeg", 0.9));
    stopStream();
  };

  const retake = () => {
    setSnapshot(null);
    openCamera();
  };

  const confirmSnapshot = async () => {
    if (!snapshot) return;
    setBusy(true);
    try {
      onChange(await compressDataUrl(snapshot));
      closeCamera();
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await compressImage(file));
    } catch {
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div
        className="w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden"
        style={{ height, borderColor: value ? "var(--primary)" : t.border, background: t.bgActive }}
      >
        {value ? (
          <img src={value} alt={label} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs" style={{ color: t.textFaint, fontFamily: mono }}>No {label.toLowerCase()} yet</span>
        )}
      </div>

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold uppercase border disabled:opacity-40"
          style={{ fontFamily: mono, borderColor: t.border, color: t.textMuted, background: t.bgBtn }}
        >
          <Upload className="w-3.5 h-3.5" /> Choose from device
        </button>
        <button
          type="button"
          onClick={openCamera}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold uppercase border disabled:opacity-40"
          style={{ fontFamily: mono, borderColor: t.border, color: t.textMuted, background: t.bgBtn }}
        >
          <Camera className="w-3.5 h-3.5" /> Take photo
        </button>
      </div>

      {cameraOpen && (
        <div className="fixed inset-0 z-[80] flex flex-col" style={{ background: "rgba(10,10,12,0.95)" }}>
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <p className="text-xs font-bold uppercase tracking-widest text-white" style={{ fontFamily: mono }}>{label}</p>
            <button onClick={closeCamera} className="p-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center px-4 pb-6 min-h-0">
            {cameraError ? (
              <div className="flex flex-col items-center gap-3 text-center max-w-xs">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
                <p className="text-sm text-white">{cameraError}</p>
                <button
                  onClick={() => { closeCamera(); fileRef.current?.click(); }}
                  className="mt-2 px-4 py-2 rounded-xl text-xs font-bold uppercase"
                  style={{ fontFamily: mono, background: "var(--primary)", color: "var(--primary-foreground)" }}
                >
                  Choose from device instead
                </button>
              </div>
            ) : snapshot ? (
              <img src={snapshot} alt="Captured" className="max-h-full max-w-full rounded-2xl object-contain" />
            ) : (
              <video ref={videoRef} playsInline muted className="max-h-full max-w-full rounded-2xl object-contain" />
            )}
          </div>

          {!cameraError && (
            <div className="flex items-center justify-center gap-6 pb-8 shrink-0">
              {snapshot ? (
                <>
                  <button onClick={retake} className="flex flex-col items-center gap-1.5 text-white">
                    <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
                      <RotateCcw className="w-5 h-5" />
                    </span>
                    <span className="text-[9px] uppercase" style={{ fontFamily: mono }}>Retake</span>
                  </button>
                  <button onClick={confirmSnapshot} disabled={busy} className="flex flex-col items-center gap-1.5 text-white disabled:opacity-40">
                    <span className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "var(--primary)" }}>
                      <Check className="w-6 h-6" style={{ color: "var(--primary-foreground)" }} />
                    </span>
                    <span className="text-[9px] uppercase" style={{ fontFamily: mono }}>Use photo</span>
                  </button>
                </>
              ) : (
                <button onClick={takeSnapshot} className="w-16 h-16 rounded-full border-4 border-white" />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
