import { useState, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// ── Unique session ID per browser ──────────────────────────────────────────
function getSessionId() {
  let id = localStorage.getItem("pathsync_session");
  if (!id) {
    id = "ps_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("pathsync_session", id);
  }
  return id;
}

// ── Scholarship Card ───────────────────────────────────────────────────────
function ScholarshipCard({ s, index }) {
  return (
    <div
      className="scholarship-card"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className="card-rank">#{index + 1}</div>
      <div className="card-body">
        <div className="card-provider">{s.provider}</div>
        <div className="card-title">{s.title}</div>
        <div className="card-amount">{s.amount || "See details"}</div>
        <div className="card-reason">✦ {s.match_reason}</div>
        <div className="card-meta">
          {s.deadline && (
            <span className="badge deadline">
              Deadline: {new Date(s.deadline).toLocaleDateString("en-NG")}
            </span>
          )}
          <span className="badge similarity">
            {Math.round((s.similarity || 0.8) * 100)}% match
          </span>
        </div>
        {s.application_url && (
          <a
            href={s.application_url}
            target="_blank"
            rel="noreferrer"
            className="apply-btn"
          >
            Apply Now →
          </a>
        )}
      </div>
    </div>
  );
}

// ── Chat Bubble ─────────────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`bubble-wrap ${isUser ? "user" : "ai"}`}>
      {!isUser && (
        <div className="avatar">
          <span>P</span>
        </div>
      )}
      <div className={`bubble ${isUser ? "bubble-user" : "bubble-ai"}`}>
        {msg.content}
      </div>
    </div>
  );
}

// ── File Upload Button ───────────────────────────────────────────────────────
function TranscriptUpload({ sessionId, onResult }) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(
        `${API_BASE}/chat/upload-transcript?session_id=${sessionId}`,
        { method: "POST", body: form }
      );
      const data = await res.json();
      onResult(data);
    } catch {
      onResult({ error: "Upload failed. Please try again." });
    }
    setLoading(false);
  };

  return (
    <div className="upload-wrap">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={handleUpload}
      />
      <button
        className="upload-btn"
        onClick={() => inputRef.current.click()}
        disabled={loading}
      >
        {loading ? "Parsing…" : "📄 Upload Transcript PDF"}
      </button>
      <span className="upload-hint">PII auto-redacted before AI processing</span>
    </div>
  );
}

// ── Stage Indicator ──────────────────────────────────────────────────────────
const STAGES = ["onboarding", "academic", "activities", "challenges", "matching"];
function StageBar({ stage }) {
  const idx = STAGES.indexOf(stage);
  return (
    <div className="stage-bar">
      {STAGES.map((s, i) => (
        <div
          key={s}
          className={`stage-dot ${i <= idx ? "active" : ""} ${i === idx ? "current" : ""}`}
          title={s.charAt(0).toUpperCase() + s.slice(1)}
        />
      ))}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [sessionId] = useState(getSessionId);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome to PathSync AI 👋 I'm here to help you find scholarships that actually fit you — not just your CGPA, but everything you bring to the table. Ready to start your discovery interview?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("onboarding");
  const [matches, setMatches] = useState([]);
  const [showMatches, setShowMatches] = useState(false);
  const [transcriptData, setTranscriptData] = useState(null);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: msg }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
      setStage(data.stage || stage);

      // Auto-fetch matches when stage reaches matching
      if (data.stage === "matching" || data.stage === "summary") {
        fetchMatches();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection error. Please check your internet and try again.",
        },
      ]);
    }
    setLoading(false);
  };

  const fetchMatches = async () => {
    try {
      const res = await fetch(`${API_BASE}/chat/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, top_k: 3 }),
      });
      const data = await res.json();
      if (data.matches?.length) {
        setMatches(data.matches);
        setShowMatches(true);
      }
    } catch {}
  };

  const handleTranscriptResult = (data) => {
    setTranscriptData(data);
    const t = data.structured_transcript;
    if (t && !t.error) {
      sendMessage(
        `I just uploaded my transcript. My CGPA is ${t.cgpa}/${t.scale} (${t.honours_class}), studying ${t.major} at ${t.level}.`
      );
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0a0e1a;
          --surface: #111827;
          --surface2: #1a2235;
          --border: #1e2d45;
          --accent: #00e5a0;
          --accent2: #0066ff;
          --gold: #f5c842;
          --text: #e8edf5;
          --muted: #7a8ba0;
          --danger: #ff4d6d;
          --radius: 16px;
          --font-head: 'Syne', sans-serif;
          --font-body: 'DM Sans', sans-serif;
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: var(--font-body);
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* ── Layout ── */
        .layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          grid-template-rows: 60px 1fr;
          height: 100vh;
        }

        /* ── Header ── */
        .header {
          grid-column: 1 / -1;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          padding: 0 24px;
          gap: 16px;
          position: relative;
          z-index: 10;
        }
        .logo {
          font-family: var(--font-head);
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .logo span { color: var(--accent); }
        .header-sub {
          font-size: 12px;
          color: var(--muted);
          border-left: 1px solid var(--border);
          padding-left: 16px;
          margin-left: 4px;
        }
        .header-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
        .privacy-badge {
          font-size: 11px;
          background: rgba(0,229,160,0.1);
          color: var(--accent);
          border: 1px solid rgba(0,229,160,0.2);
          padding: 4px 10px;
          border-radius: 20px;
        }

        /* ── Sidebar ── */
        .sidebar {
          background: var(--surface);
          border-right: 1px solid var(--border);
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow-y: auto;
        }
        .sidebar-section { }
        .sidebar-label {
          font-family: var(--font-head);
          font-size: 10px;
          font-weight: 700;
          color: var(--muted);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        /* ── Stage bar ── */
        .stage-bar {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .stage-dot {
          height: 6px;
          border-radius: 3px;
          background: var(--border);
          transition: all 0.3s ease;
        }
        .stage-dot.active { background: rgba(0,229,160,0.3); }
        .stage-dot.current { background: var(--accent); box-shadow: 0 0 8px var(--accent); }

        /* ── Upload ── */
        .upload-wrap { display: flex; flex-direction: column; gap: 6px; }
        .upload-btn {
          background: var(--surface2);
          border: 1px dashed var(--border);
          color: var(--text);
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-family: var(--font-body);
          transition: all 0.2s;
          text-align: left;
        }
        .upload-btn:hover { border-color: var(--accent); color: var(--accent); }
        .upload-hint { font-size: 10px; color: var(--muted); line-height: 1.4; }

        /* ── Matches button ── */
        .matches-toggle {
          background: linear-gradient(135deg, var(--accent2), #0044cc);
          border: none;
          color: white;
          padding: 10px 14px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-family: var(--font-body);
          font-weight: 500;
          width: 100%;
          transition: opacity 0.2s;
        }
        .matches-toggle:hover { opacity: 0.85; }

        /* ── Chat panel ── */
        .chat-panel {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 60px);
          overflow: hidden;
        }
        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scroll-behavior: smooth;
        }
        .messages::-webkit-scrollbar { width: 4px; }
        .messages::-webkit-scrollbar-track { background: transparent; }
        .messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

        /* ── Bubbles ── */
        .bubble-wrap {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          max-width: 75%;
          animation: fadeUp 0.25s ease forwards;
        }
        .bubble-wrap.user { align-self: flex-end; flex-direction: row-reverse; }
        .bubble-wrap.ai { align-self: flex-start; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, var(--accent2), var(--accent));
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-head); font-weight: 700; font-size: 13px;
          color: var(--bg); flex-shrink: 0;
        }

        .bubble {
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.6;
          max-width: 100%;
        }
        .bubble-ai {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-bottom-left-radius: 4px;
          color: var(--text);
        }
        .bubble-user {
          background: linear-gradient(135deg, var(--accent2), #0044cc);
          color: white;
          border-bottom-right-radius: 4px;
        }

        /* ── Typing indicator ── */
        .typing { display: flex; gap: 4px; padding: 14px 16px; align-items: center; }
        .typing span {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--muted);
          animation: bounce 1.2s infinite;
        }
        .typing span:nth-child(2) { animation-delay: 0.2s; }
        .typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }

        /* ── Input area ── */
        .input-area {
          padding: 16px 24px 20px;
          background: var(--surface);
          border-top: 1px solid var(--border);
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }
        .input-area textarea {
          flex: 1;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 12px;
          color: var(--text);
          font-family: var(--font-body);
          font-size: 14px;
          padding: 12px 16px;
          resize: none;
          min-height: 46px;
          max-height: 120px;
          outline: none;
          line-height: 1.5;
          transition: border-color 0.2s;
        }
        .input-area textarea:focus { border-color: var(--accent); }
        .input-area textarea::placeholder { color: var(--muted); }
        .send-btn {
          background: var(--accent);
          border: none;
          color: var(--bg);
          width: 46px; height: 46px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 18px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .send-btn:hover { transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Quick replies ── */
        .quick-replies {
          display: flex; flex-wrap: wrap; gap: 6px;
          padding: 8px 24px 0;
        }
        .qr-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--muted);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-family: var(--font-body);
          cursor: pointer;
          transition: all 0.2s;
        }
        .qr-btn:hover { border-color: var(--accent); color: var(--accent); }

        /* ── Scholarship panel ── */
        .scholarship-panel {
          position: fixed;
          right: 0; top: 60px; bottom: 0;
          width: 380px;
          background: var(--surface);
          border-left: 1px solid var(--border);
          overflow-y: auto;
          padding: 24px 20px;
          z-index: 20;
          animation: slideIn 0.3s ease;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        .panel-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px;
        }
        .panel-title {
          font-family: var(--font-head);
          font-size: 16px;
          font-weight: 700;
        }
        .panel-close {
          background: none; border: 1px solid var(--border);
          color: var(--muted); width: 28px; height: 28px;
          border-radius: 6px; cursor: pointer; font-size: 14px;
        }
        .panel-close:hover { color: var(--text); border-color: var(--text); }

        /* ── Scholarship cards ── */
        .scholarship-card {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          margin-bottom: 14px;
          display: flex;
          gap: 12px;
          animation: fadeUp 0.3s ease forwards;
          opacity: 0;
        }
        .card-rank {
          font-family: var(--font-head);
          font-size: 22px;
          font-weight: 800;
          color: var(--accent);
          line-height: 1;
          flex-shrink: 0;
          padding-top: 2px;
        }
        .card-body { flex: 1; }
        .card-provider { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-bottom: 4px; }
        .card-title { font-family: var(--font-head); font-weight: 700; font-size: 14px; line-height: 1.3; margin-bottom: 6px; }
        .card-amount { font-size: 13px; color: var(--gold); font-weight: 500; margin-bottom: 8px; }
        .card-reason { font-size: 12px; color: var(--accent); margin-bottom: 10px; line-height: 1.4; }
        .card-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
        .badge {
          font-size: 10px; padding: 3px 8px; border-radius: 20px;
        }
        .badge.deadline { background: rgba(245,200,66,0.1); color: var(--gold); border: 1px solid rgba(245,200,66,0.2); }
        .badge.similarity { background: rgba(0,229,160,0.1); color: var(--accent); border: 1px solid rgba(0,229,160,0.2); }
        .apply-btn {
          display: inline-block;
          background: linear-gradient(135deg, var(--accent2), var(--accent));
          color: white;
          text-decoration: none;
          font-size: 12px;
          font-weight: 600;
          padding: 7px 14px;
          border-radius: 8px;
          transition: opacity 0.2s;
        }
        .apply-btn:hover { opacity: 0.85; }

        /* ── Transcript result ── */
        .transcript-result {
          background: rgba(0,229,160,0.05);
          border: 1px solid rgba(0,229,160,0.2);
          border-radius: 10px;
          padding: 12px 14px;
          margin-top: 10px;
        }
        .transcript-result h4 {
          font-family: var(--font-head);
          font-size: 12px;
          color: var(--accent);
          margin-bottom: 6px;
        }
        .transcript-result p { font-size: 12px; color: var(--muted); line-height: 1.6; }

        @media (max-width: 768px) {
          .layout { grid-template-columns: 1fr; }
          .sidebar { display: none; }
          .scholarship-panel { width: 100%; }
        }
      `}</style>

      <div className="layout">
        {/* Header */}
        <header className="header">
          <div className="logo">Path<span>Sync</span> AI</div>
          <div className="header-sub">Student Financial Support System</div>
          <div className="header-right">
            <span className="privacy-badge">🔒 PII-Protected</span>
          </div>
        </header>

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">Interview Progress</div>
            <StageBar stage={stage} />
          </div>

          <div className="sidebar-section">
            <div className="sidebar-label">Transcript</div>
            <TranscriptUpload
              sessionId={sessionId}
              onResult={handleTranscriptResult}
            />
            {transcriptData?.structured_transcript && !transcriptData.structured_transcript.error && (
              <div className="transcript-result">
                <h4>✓ Transcript Parsed</h4>
                <p>
                  CGPA: <strong>{transcriptData.structured_transcript.cgpa}</strong> /{" "}
                  {transcriptData.structured_transcript.scale}<br />
                  {transcriptData.structured_transcript.honours_class}<br />
                  {transcriptData.structured_transcript.major}
                </p>
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-label">Scholarships</div>
            <button className="matches-toggle" onClick={fetchMatches}>
              🎯 Find My Matches
            </button>
            {matches.length > 0 && (
              <button
                className="matches-toggle"
                style={{ marginTop: 8, background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
                onClick={() => setShowMatches((v) => !v)}
              >
                {showMatches ? "Hide" : "View"} {matches.length} Matches
              </button>
            )}
          </div>
        </aside>

        {/* Chat panel */}
        <main className="chat-panel">
          <div className="messages">
            {messages.map((msg, i) => (
              <Bubble key={i} msg={msg} />
            ))}
            {loading && (
              <div className="bubble-wrap ai">
                <div className="avatar"><span>P</span></div>
                <div className="bubble bubble-ai">
                  <div className="typing">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick reply suggestions */}
          {messages.length <= 2 && (
            <div className="quick-replies">
              {[
                "I'm in 300L Engineering",
                "My CGPA is 4.2/5.0",
                "I run a community project",
                "I need help with fees",
              ].map((q) => (
                <button key={q} className="qr-btn" onClick={() => sendMessage(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="input-area">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Tell me about yourself…"
              rows={1}
            />
            <button
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
            >
              ↑
            </button>
          </div>
        </main>

        {/* Scholarship results panel */}
        {showMatches && matches.length > 0 && (
          <div className="scholarship-panel">
            <div className="panel-header">
              <div className="panel-title">🎯 Your Top Matches</div>
              <button className="panel-close" onClick={() => setShowMatches(false)}>✕</button>
            </div>
            {matches.map((s, i) => (
              <ScholarshipCard key={s.id || i} s={s} index={i} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
