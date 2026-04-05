"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare, X, Send, Sparkles, Trash2,
  Bot, User, Minimize2, Maximize2
} from "lucide-react";

interface AIChatWidgetProps {
  courseId?: string;
  courseTitle?: string;
  courseCategory?: string;
  courseNarrative?: string;
}

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export default function AIChatWidget({ courseId, courseTitle, courseCategory, courseNarrative }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          courseId,
          courseTitle,
          courseCategory,
          courseNarrative,
        }),
      });

      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "Maaf, saya tidak bisa menjawab saat ini.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Maaf, terjadi gangguan koneksi. Coba lagi nanti ya! 🙏",
        timestamp: new Date(),
      }]);
    }
    setLoading(false);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const chatWidth = isExpanded ? 480 : 380;
  const chatHeight = isExpanded ? 600 : 480;

  return (
    <>
      {/* Chat bubble button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 1000,
            width: 56, height: 56, borderRadius: 16,
            background: "linear-gradient(135deg, #7C3AED, #2563EB)",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 32px rgba(37,99,235,0.35)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onMouseEnter={e => {
            (e.target as HTMLElement).style.transform = "scale(1.1)";
          }}
          onMouseLeave={e => {
            (e.target as HTMLElement).style.transform = "scale(1)";
          }}
        >
          <Sparkles size={24} color="white" />
          {/* Notification dot */}
          {messages.length === 0 && (
            <span style={{
              position: "absolute", top: -2, right: -2,
              width: 14, height: 14, borderRadius: "50%",
              background: "#EF4444", border: "2px solid white",
              fontSize: 8, fontWeight: 700, color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>AI</span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1000,
          width: chatWidth, height: chatHeight,
          background: "white", borderRadius: 20,
          border: "1px solid var(--border)",
          boxShadow: "0 20px 60px rgba(15,23,42,0.18)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          animation: "chatIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}>
          <style>{`
            @keyframes chatIn {
              from { opacity: 0; transform: translateY(20px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #7C3AED, #2563EB)",
            padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Bot size={18} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "white", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  IntelliCourse AI
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                  {courseTitle ? `📚 ${courseTitle}` : "Asisten Belajar Pribadi"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={clearChat} title="Hapus chat" style={{
                background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
                width: 30, height: 30, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Trash2 size={13} color="white" />
              </button>
              <button onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? "Kecilkan" : "Perbesar"} style={{
                background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
                width: 30, height: 30, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {isExpanded ? <Minimize2 size={13} color="white" /> : <Maximize2 size={13} color="white" />}
              </button>
              <button onClick={() => setIsOpen(false)} style={{
                background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
                width: 30, height: 30, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <X size={14} color="white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "16px 16px 8px",
            display: "flex", flexDirection: "column", gap: 12,
            background: "var(--bg-base)",
          }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16, margin: "0 auto 16px",
                  background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(37,99,235,0.1))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Sparkles size={24} color="var(--primary)" />
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--text-1)" }}>
                  Halo! 👋
                </h4>
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
                  {courseTitle
                    ? `Saya siap membantu Anda memahami materi "${courseTitle}". Tanyakan apa saja!`
                    : "Saya adalah asisten AI Anda. Tanyakan apa pun tentang coding, teknologi, atau materi pelajaran!"}
                </p>
                {/* Quick prompts */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 16 }}>
                  {(courseTitle
                    ? [
                        "Jelaskan konsep utama course ini",
                        "Apa prerequisite yang dibutuhkan?",
                        "Berikan tips untuk menyelesaikan course ini",
                      ]
                    : [
                        "Rekomendasi course untuk pemula",
                        "Jelaskan apa itu machine learning",
                        "Tips belajar programming efektif",
                      ]
                  ).map(prompt => (
                    <button key={prompt} onClick={() => { setInput(prompt); }}
                      style={{
                        background: "white", border: "1px solid var(--border)", borderRadius: 10,
                        padding: "8px 14px", cursor: "pointer", textAlign: "left",
                        fontSize: 12, color: "var(--text-2)", transition: "all 0.15s",
                      }}
                      onMouseEnter={e => {
                        (e.target as HTMLElement).style.borderColor = "var(--primary)";
                        (e.target as HTMLElement).style.color = "var(--primary)";
                      }}
                      onMouseLeave={e => {
                        (e.target as HTMLElement).style.borderColor = "var(--border)";
                        (e.target as HTMLElement).style.color = "var(--text-2)";
                      }}
                    >
                      💡 {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} style={{
                display: "flex", gap: 8,
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
                alignItems: "flex-start",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, var(--primary-dark), var(--primary))"
                    : "linear-gradient(135deg, #7C3AED, #2563EB)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {msg.role === "user"
                    ? <User size={13} color="white" />
                    : <Bot size={13} color="white" />}
                </div>
                <div style={{
                  maxWidth: "80%",
                  background: msg.role === "user" ? "var(--primary)" : "white",
                  color: msg.role === "user" ? "white" : "var(--text-1)",
                  border: msg.role === "user" ? "none" : "1px solid var(--border)",
                  borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  padding: "10px 14px", fontSize: 13, lineHeight: 1.6,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  whiteSpace: "pre-wrap",
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: "linear-gradient(135deg, #7C3AED, #2563EB)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Bot size={13} color="white" />
                </div>
                <div style={{
                  background: "white", border: "1px solid var(--border)",
                  borderRadius: "14px 14px 14px 4px", padding: "12px 16px",
                  display: "flex", gap: 5,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--primary)", opacity: 0.6, animation: "typeBounce 1.4s infinite", animationDelay: "0s" }} />
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--primary)", opacity: 0.6, animation: "typeBounce 1.4s infinite", animationDelay: "0.2s" }} />
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--primary)", opacity: 0.6, animation: "typeBounce 1.4s infinite", animationDelay: "0.4s" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "12px 16px", borderTop: "1px solid var(--border)", background: "white",
            display: "flex", gap: 8, alignItems: "center", flexShrink: 0,
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanyakan sesuatu..."
              style={{
                flex: 1, border: "1.5px solid var(--border)", borderRadius: 12,
                padding: "10px 14px", fontSize: 13, outline: "none",
                fontFamily: "'Inter', sans-serif", background: "var(--bg-base)",
                color: "var(--text-1)", transition: "border 0.15s",
              }}
              onFocus={e => { e.target.style.borderColor = "var(--primary)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--border)"; }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{
                width: 40, height: 40, borderRadius: 12, border: "none",
                background: input.trim() && !loading
                  ? "linear-gradient(135deg, #7C3AED, #2563EB)"
                  : "var(--bg-base)",
                cursor: input.trim() && !loading ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s", flexShrink: 0,
                boxShadow: input.trim() && !loading ? "0 4px 12px rgba(37,99,235,0.3)" : "none",
              }}
            >
              <Send size={16} color={input.trim() && !loading ? "white" : "var(--text-3)"} />
            </button>
          </div>

          <style>{`
            @keyframes typeBounce {
              0%, 80%, 100% { transform: translateY(0); }
              40% { transform: translateY(-5px); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
