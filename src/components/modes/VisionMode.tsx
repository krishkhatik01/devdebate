"use client";
import { useState, useRef, useCallback } from "react";
import {
  Camera, ImageIcon, Upload, X, Send,
  Loader2, RefreshCw, Eye
} from "lucide-react";
import VoiceButton from "@/components/VoiceButton";

type VisionTab = "gallery" | "camera";

const VISION_PROMPTS = [
  "Explain this code/diagram in detail",
  "What errors or bugs do you see?",
  "Explain this architecture diagram",
  "What does this error message mean?",
  "Review this UI/UX design",
  "Explain this database schema",
  "What algorithm is shown here?",
  "Analyze this system design diagram",
];

export default function VisionMode() {
  const [tab, setTab] = useState<VisionTab>("gallery");
  const [image, setImage] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Gallery upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target?.result as string);
      setResponse("");
      setError("");
    };
    reader.readAsDataURL(file);
  };

  // Camera start
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      setStream(mediaStream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setError("Camera access denied. Please allow camera permission.");
    }
  };

  // Camera stop
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  }, [stream]);

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setImage(dataUrl);
    setResponse("");
    stopCamera();
  };

  // Clear image
  const clearImage = () => {
    setImage(null);
    setImageFile(null);
    setResponse("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Analyze image
  const analyzeImage = async () => {
    if (!image || !prompt.trim()) {
      setError("Please upload an image and enter a question");
      return;
    }
    setError("");
    setLoading(true);
    setResponse("");

    try {
      // Convert to base64
      const base64 = image.split(",")[1];
      const mimeType = image.split(";")[0].split(":")[1];

      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Image: base64,
          mimeType,
          prompt
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResponse(data.response);
      setPrompt("");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Analysis failed. Try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border)] 
        flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Eye size={22} className="text-[var(--accent-primary)]" />
          <div>
            <h1 className="text-lg font-bold font-display 
              text-[var(--text-primary)]">
              Vision Mode
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Upload or capture → AI analyzes
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[var(--bg-elevated)] rounded-xl p-1 gap-1">
          <button
            onClick={() => { setTab("gallery"); stopCamera(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg 
              text-sm font-medium transition-all ${tab === "gallery"
                ? "bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
          >
            <ImageIcon size={15} /> Gallery
          </button>
          <button
            onClick={() => { setTab("camera"); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg 
              text-sm font-medium transition-all ${tab === "camera"
                ? "bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
          >
            <Camera size={15} /> Camera
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left - Image Panel */}
        <div className="w-96 flex-shrink-0 border-r border-[var(--border)] 
          flex flex-col bg-[var(--bg-secondary)]">

          {/* Gallery Tab */}
          {tab === "gallery" && (
            <div className="flex-1 flex flex-col p-4">
              {!image ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex flex-col items-center justify-center 
                    border-2 border-dashed border-[var(--border-strong)] 
                    rounded-2xl cursor-pointer hover:border-[var(--accent-primary)]
                    hover:bg-[var(--accent-primary)]/5 transition-all"
                >
                  <Upload size={36} className="text-[var(--text-muted)] mb-3" />
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Click to upload image
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    PNG, JPG, WEBP supported
                  </p>
                  <p className="text-xs text-[var(--accent-primary)] mt-3">
                    Code screenshots, diagrams, errors...
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-3">
                  <div className="relative flex-1 rounded-xl overflow-hidden 
                    bg-[var(--bg-card)] min-h-0">
                    <img
                      src={image}
                      alt="Uploaded"
                      className="w-full h-full object-contain"
                    />
                    <button
                      onClick={clearImage}
                      className="absolute top-2 right-2 p-1.5 rounded-lg 
                        bg-black/50 text-white hover:bg-black/70 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-2
                      rounded-xl border border-[var(--border)] 
                      text-sm text-[var(--text-secondary)]
                      hover:border-[var(--accent-primary)] 
                      hover:text-[var(--accent-primary)] transition-all"
                  >
                    <RefreshCw size={14} /> Change Image
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Camera Tab */}
          {tab === "camera" && (
            <div className="flex-1 flex flex-col p-4 gap-3">
              {!image ? (
                <>
                  <div className="flex-1 rounded-xl overflow-hidden 
                    bg-black relative min-h-0">
                    {cameraActive ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center 
                        justify-center text-white/50">
                        <Camera size={48} className="mb-3" />
                        <p className="text-sm">Camera preview</p>
                      </div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  {!cameraActive ? (
                    <button
                      onClick={startCamera}
                      className="py-3 rounded-xl font-medium text-sm
                        bg-[var(--accent-primary)] text-white
                        hover:opacity-90 transition-all
                        flex items-center justify-center gap-2"
                    >
                      <Camera size={16} /> Start Camera
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={capturePhoto}
                        className="flex-1 py-3 rounded-xl font-bold text-sm
                          bg-[var(--accent-primary)] text-white
                          hover:opacity-90 transition-all
                          flex items-center justify-center gap-2"
                      >
                        📸 Capture
                      </button>
                      <button
                        onClick={stopCamera}
                        className="px-4 py-3 rounded-xl border 
                          border-[var(--border)] text-[var(--text-secondary)]
                          hover:border-red-500 hover:text-red-400 transition-all"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col gap-3">
                  <div className="relative flex-1 rounded-xl overflow-hidden 
                    bg-[var(--bg-card)] min-h-0">
                    <img
                      src={image}
                      alt="Captured"
                      className="w-full h-full object-contain"
                    />
                    <button
                      onClick={clearImage}
                      className="absolute top-2 right-2 p-1.5 rounded-lg 
                        bg-black/50 text-white hover:bg-black/70"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => { clearImage(); startCamera(); }}
                    className="flex items-center justify-center gap-2 py-2
                      rounded-xl border border-[var(--border)]
                      text-sm text-[var(--text-secondary)]
                      hover:border-[var(--accent-primary)]
                      hover:text-[var(--accent-primary)] transition-all"
                  >
                    <Camera size={14} /> Retake
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right - Analysis Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Response Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {!response && !loading && (
              <div className="h-full flex flex-col items-center 
                justify-center text-center">
                <Eye size={48} className="text-[var(--accent-primary)]/30 mb-4" />
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                  AI Vision Mode
                </h2>
                <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6">
                  Upload a screenshot, photo, or diagram and ask anything about it
                </p>
                <div className="grid grid-cols-2 gap-2 max-w-md w-full">
                  {VISION_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPrompt(p)}
                      className="px-3 py-2 rounded-xl border border-[var(--border)]
                        text-xs text-[var(--text-secondary)] text-left
                        hover:border-[var(--accent-primary)]
                        hover:text-[var(--accent-primary)] transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="h-full flex flex-col items-center 
                justify-center gap-4">
                <Loader2 size={32} className="animate-spin 
                  text-[var(--accent-primary)]" />
                <p className="text-sm text-[var(--text-secondary)]">
                  AI dekh raha hai... 👁️
                </p>
              </div>
            )}

            {response && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full 
                      bg-[var(--accent-primary)]/20 flex items-center 
                      justify-center text-[var(--accent-primary)] text-xs font-bold">
                      AI
                    </div>
                    <span className="text-sm font-medium 
                      text-[var(--text-primary)]">
                      Analysis
                    </span>
                  </div>
                  <VoiceButton
                    onTranscript={(t) => setPrompt(t)}
                    onSpeakText={response}
                  />
                </div>
                <div className="bg-[var(--bg-card)] border border-[var(--border)]
                  rounded-xl p-5 text-sm text-[var(--text-primary)] 
                  leading-relaxed whitespace-pre-wrap">
                  {response}
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="p-4 border-t border-[var(--border)] 
            bg-[var(--bg-secondary)] flex-shrink-0">
            {error && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/10 
                border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      analyzeImage();
                    }
                  }}
                  placeholder="Image ke baare mein kuch bhi poocho..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)]
                    border border-[var(--border-strong)] 
                    text-[var(--text-primary)] text-sm resize-none
                    placeholder-[var(--text-muted)] focus:outline-none
                    focus:border-[var(--accent-primary)] transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <VoiceButton
                  onTranscript={(t) => setPrompt(t)}
                  disabled={loading}
                />
                <button
                  onClick={analyzeImage}
                  disabled={loading || !image || !prompt.trim()}
                  className="p-3 rounded-xl bg-[var(--accent-primary)] 
                    text-white disabled:opacity-40 
                    disabled:cursor-not-allowed
                    hover:opacity-90 transition-all"
                >
                  {loading
                    ? <Loader2 size={18} className="animate-spin" />
                    : <Send size={18} />
                  }
                </button>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Ctrl+Enter to analyze • Mic for voice input
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
