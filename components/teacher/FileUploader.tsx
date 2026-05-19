"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileVideo, FileImage, FileText, File, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

interface FileUploaderProps {
  accept?: string;
  maxSizeMB?: number;
  folder?: string;
  bucket?: string;
  onUploadComplete: (result: { url: string; path: string; size: number; type: string; name: string }) => void;
  onError?: (error: string) => void;
  label?: string;
  currentFile?: string | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(type: string) {
  if (type.startsWith("video/")) return FileVideo;
  if (type.startsWith("image/")) return FileImage;
  if (type.includes("pdf") || type.includes("document")) return FileText;
  return File;
}

export default function FileUploader({
  accept = "video/*,image/*,application/pdf",
  maxSizeMB = 50,
  folder = "",
  bucket = "course-content",
  onUploadComplete,
  onError,
  label = "Upload File",
  currentFile,
}: FileUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; type: string; url: string } | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError("");

    // Validate size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      const msg = `File terlalu besar. Maksimal ${maxSizeMB}MB.`;
      setError(msg);
      onError?.(msg);
      return;
    }

    setUploading(true);
    setProgress(0);

    // Simulate progress during upload
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 15, 90));
    }, 300);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);
      if (folder) formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload gagal");
      }

      const result = await res.json();
      setProgress(100);
      setUploadedFile({ name: file.name, size: file.size, type: file.type, url: result.url });
      onUploadComplete(result);
    } catch (err: any) {
      clearInterval(progressInterval);
      const msg = err.message || "Upload gagal";
      setError(msg);
      onError?.(msg);
    } finally {
      setUploading(false);
    }
  }, [maxSizeMB, bucket, folder, onUploadComplete, onError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }, [handleFile]);

  const clearFile = () => {
    setUploadedFile(null);
    setProgress(0);
    setError("");
  };

  const FileIcon = uploadedFile ? getFileIcon(uploadedFile.type) : Upload;

  return (
    <div>
      <label style={{
        display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8,
        color: "var(--text-1)", fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>{label}</label>

      {/* Success state */}
      {uploadedFile && !uploading ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          background: "rgba(16,185,129,0.06)", border: "1.5px solid rgba(16,185,129,0.2)",
          borderRadius: 12, padding: "14px 18px",
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: "rgba(16,185,129,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <FileIcon size={20} color="#10B981" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: "var(--text-1)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{uploadedFile.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <CheckCircle2 size={11} color="#10B981" />
              <span>{formatFileSize(uploadedFile.size)} — Uploaded</span>
            </div>
          </div>
          <button onClick={clearFile} style={{
            background: "transparent", border: "none", cursor: "pointer",
            padding: 4, display: "flex", color: "var(--text-3)",
          }}>
            <X size={16} />
          </button>
        </div>
      ) : currentFile && !uploading ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          background: "var(--primary-subtle)", border: "1.5px solid rgba(37,99,235,0.15)",
          borderRadius: 12, padding: "14px 18px",
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: "rgba(37,99,235,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <CheckCircle2 size={20} color="var(--primary)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>File sudah diupload</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>Klik di sini untuk mengganti file</div>
          </div>
          <button onClick={() => inputRef.current?.click()} style={{
            background: "var(--primary)", color: "white", border: "none",
            borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            Ganti
          </button>
        </div>
      ) : (
        /* Drop zone */
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? "var(--primary)" : error ? "rgba(239,68,68,0.4)" : "var(--border)"}`,
            borderRadius: 14,
            padding: "32px 24px",
            textAlign: "center",
            cursor: uploading ? "default" : "pointer",
            background: dragging ? "var(--primary-subtle)" : error ? "rgba(239,68,68,0.04)" : "var(--bg-base)",
            transition: "all 0.2s",
          }}
        >
          {uploading ? (
            <div>
              <Loader2 size={28} color="var(--primary)" style={{ margin: "0 auto 12px", animation: "spin-slow 1s linear infinite" }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 8 }}>
                Mengupload...
              </div>
              {/* Progress bar */}
              <div style={{
                height: 6, background: "var(--border)", borderRadius: 99,
                overflow: "hidden", maxWidth: 260, margin: "0 auto",
              }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  background: "linear-gradient(90deg, var(--primary-dark), var(--primary-light))",
                  width: `${progress}%`, transition: "width 0.3s ease",
                }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>{Math.round(progress)}%</div>
            </div>
          ) : (
            <div>
              <Upload size={28} color={error ? "#EF4444" : "var(--text-3)"} style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>
                {dragging ? "Lepaskan file di sini" : "Drag & drop atau klik untuk upload"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                Maks. {maxSizeMB}MB — {accept.replace(/\*/g, "").replace(/,/g, ", ")}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginTop: 8,
          fontSize: 12, color: "#EF4444",
        }}>
          <AlertTriangle size={13} />
          {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: "none" }}
      />
    </div>
  );
}
