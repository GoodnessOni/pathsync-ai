import { useState, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const SYSTEM_CONTEXT = (profile) => `
You are PathSync AI, a warm and insightful scholarship advisor for Nigerian university students.

STUDENT PROFILE ALREADY COLLECTED:
- University: ${profile.university}
- Course: ${profile.course}
- Level: ${profile.level}
- CGPA: ${profile.cgpa}/${profile.cgpaScale}
- Demographics: ${profile.demographics?.join(", ") || "Not specified"}
- Leadership: ${profile.leadership}
- Projects/Activities: ${profile.projects}
- Goal: ${profile.goal}
- About themselves: ${profile.about}

YOUR JOB:
Ask exactly 3 follow-up questions to extract MORE hidden achievements not captured above.
Each question must be SHORT — max 2 sentences.
After the student answers all 3, say EXACTLY: "Perfect! I have everything I need. Let me find your matches now." and nothing else.

TRANSLATION RULES — always apply:
- "I manage social media" → Digital Communications & Community Engagement
- "I tutor students" → Peer Education, Mentorship & Curriculum Delivery  
- "I run a business" → Entrepreneurship & Financial Management
- "I'm class rep" → Student Government & Stakeholder Liaison
- "I play/manage sports" → Project Coordination & Community Leadership

STRICT RULES:
- Max 2 sentences per response
- Ask only ONE question at a time
- Be warm, encouraging, peer-level Nigerian English
- NEVER ask for name, NIN, address or financial details
- Track question count internally — stop at 3
`;

export default function Discover({ navigate, profile, sessionId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [done, setDone] = useState(false);
  const [finding, setFinding] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    startConversation();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const startConversation = async () => {
  setLoading(true);
  try {
    // FIRST — seed the backend with the onboarding profile
    const profileText = `
Student Profile:
- University: ${profile.university}
- Course: ${profile.course}
- Level: ${profile.level}
- CGPA: ${profile.cgpa}/${profile.cgpaScale}
- Demographics: ${profile.demographics?.join(", ") || "None specified"}
- Leadership: ${profile.leadership}
- Activities/Projects: ${profile.projects}
- Goal: ${profile.goal}
- About themselves: ${profile.about}
    `.trim();

    // Send profile as first message to seed session in backend
    const seedRes = await fetch(`${API_BASE}/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        message: `[PROFILE_SEED] ${profileText}. Now ask me your first follow-up question in 2 sentences max.`,
      }),
    });
    const seedData = await seedRes.json();
    setMessages([{ role: "assistant", content: seedData.response }]);
    setQuestionCount(1);
  } catch (err) {
    console.error("Start error:", err);
    setMessages([{
      role: "assistant",
      content: "Hey! I've reviewed your profile. Outside of what you've shared, what's one thing you do that you're genuinely proud of — big or small?",
    }]);
    setQuestionCount(1);
  }
  setLoading(false);
};

  const buildFirstMessage = () => {
    return `[SYSTEM CONTEXT: ${SYSTEM_CONTEXT(profile)}] 
    
    The student has completed their profile. Start the discovery with your FIRST follow-up question. Be warm and brief — 2 sentences max.`;
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading || done) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: msg,
        }),
      });
      const data = await res.json();
      const response = data.response;

      setMessages(prev => [...prev, { role: "assistant", content: response }]);

      const newCount = questionCount + 1;
      setQuestionCount(newCount);

      // Check if Claude signals it's done OR we've hit 3 questions
      const isDone =
        response.toLowerCase().includes("let me find your matches") ||
        response.toLowerCase().includes("i have everything i need") ||
        newCount >= 4;

      if (isDone) {
        setDone(true);
        setTimeout(() => findMatches(), 1500);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Connection error. Please check your internet and try again.",
      }]);
    }
    setLoading(false);
  };

  const findMatches = async () => {
    setFinding(true);
    try {
      const res = await fetch(`${API_BASE}/chat/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, top_k: 3 }),
      });
      const data = await res.json();
      navigate("matches", { matches: data.matches || [] });
    } catch {
      navigate("matches", { matches: [] });
    }
    setFinding(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const progressWidth = Math.min((questionCount / 3) * 100, 100);

  return (
    <>
      <style>{`
        .discover {
          min-height: 100vh; background: var(--bg);
          display: flex; flex-direction: column;
        }

        /* MESSAGES */
        .dc-messages {
          flex: 1; padding: 24px;
          display: flex; flex-direction: column; gap: 16px;
          max-width: 680px; width: 100%; margin: 0 auto;
        }

        .dc-intro {
          background: linear-gradient(135deg, #dcfce7, #d1fae5);
          border: 1px solid #bbf7d0; border-radius: 12px;
          padding: 16px 20px; text-align: center;
          font-size: 13px; color: #15803d; line-height: 1.6;
        }
        @media (prefers-color-scheme: dark) {
          .dc-intro { background: rgba(34,197,94,0.08); border-color: rgba(34,197,94,0.2); color: #4ade80; }
        }

        .bwrap {
          display: flex; gap: 10px; align-items: flex-end;
          animation: fadeUp 0.3s ease;
        }
        .bwrap.user { flex-direction: row-reverse; align-self: flex-end; max-width: 78%; }
        .bwrap.ai { align-self: flex-start; max-width: 82%; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .av {
          width: 34px; height: 34px; border-radius: 50%;
          background: linear-gradient(135deg, #16a34a, #15803d);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 800; color: white; flex-shrink: 0;
        }

        .bubble {
          padding: 12px 16px; border-radius: 18px;
          font-size: 14px; line-height: 1.65;
        }
        .bubble.ai-b {
          background: var(--surface); border: 1px solid var(--border);
          color: var(--text); border-bottom-left-radius: 4px;
        }
        .bubble.user-b {
          background: var(--accent); color: white;
          border-bottom-right-radius: 4px;
        }

        .typing {
          display: flex; gap: 4px; padding: 12px 16px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 18px; border-bottom-left-radius: 4px;
          align-items: center;
        }
        .typing span {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--muted); animation: bounce 1.2s infinite;
        }
        .typing span:nth-child(2) { animation-delay: 0.2s; }
        .typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%,60%,100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }

        /* FINDING MATCHES */
        .finding-overlay {
          position: fixed; inset: 0; background: var(--bg);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          z-index: 100; gap: 20px;
        }
        .finding-spinner {
          width: 56px; height: 56px;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .finding-title { font-size: 20px; font-weight: 800; color: var(--text); }
        .finding-sub { font-size: 14px; color: var(--text2); text-align: center; max-width: 300px; line-height: 1.6; }
        .finding-steps { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
        .finding-step { font-size: 13px; color: var(--accent); display: flex; align-items: center; gap: 8px; }

        /* DONE BANNER */
        .done-banner {
          background: linear-gradient(135deg, #dcfce7, #d1fae5);
          border: 1px solid #bbf7d0; border-radius: 12px;
          padding: 16px 20px; text-align: center;
          font-size: 14px; color: #15803d; font-weight: 600;
          animation: fadeUp 0.4s ease;
        }
        @media (prefers-color-scheme: dark) {
          .done-banner { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.2); color: #4ade80; }
        }

        /* INPUT */
        .dc-input-area {
          padding: 16px 24px 20px;
          background: var(--surface); border-top: 1px solid var(--border);
          max-width: 680px; width: 100%; margin: 0 auto;
          display: flex; gap: 10px; align-items: flex-end;
        }
        .dc-input-wrap { flex: 1; }
        .dc-textarea {
          width: 100%; background: var(--bg);
          border: 1.5px solid var(--border); border-radius: 12px;
          color: var(--text); font-family: inherit; font-size: 14px;
          padding: 12px 16px; resize: none; outline: none;
          min-height: 46px; max-height: 120px; line-height: 1.5;
          transition: border-color 0.2s;
        }
        .dc-textarea:focus { border-color: var(--accent); }
        .dc-textarea::placeholder { color: var(--muted); }
        .dc-send {
          background: var(--accent); color: white; border: none;
          width: 46px; height: 46px; border-radius: 12px;
          font-size: 18px; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
          transition: all 0.2s; box-shadow: 0 2px 8px rgba(22,163,74,0.3);
        }
        .dc-send:hover:not(:disabled) { background: var(--accent2); transform: translateY(-1px); }
        .dc-send:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
      `}</style>

      {/* FINDING OVERLAY */}
      {finding && (
        <div className="finding-overlay">
          <div className="finding-spinner" />
          <div className="finding-title">Finding your matches...</div>
          <div className="finding-sub">PathSync AI is searching the scholarship knowledge base for your best opportunities</div>
          <div className="finding-steps">
            <div className="finding-step">✓ Profile analysed</div>
            <div className="finding-step">✓ Hidden achievements extracted</div>
            <div className="finding-step">⏳ Matching scholarships...</div>
          </div>
        </div>
      )}

      <div className="discover">
        
        {/* MESSAGES */}
        <div className="dc-messages">
          <div className="dc-intro">
            ✅ Profile received! I just need to ask you <strong>3 quick questions</strong> to complete your picture — then your matches are ready.
          </div>

          {messages.map((msg, i) => (
            <div key={i} className={`bwrap ${msg.role === "user" ? "user" : "ai"}`}>
              {msg.role === "assistant" && <div className="av">P</div>}
              <div className={`bubble ${msg.role === "user" ? "user-b" : "ai-b"}`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="bwrap ai">
              <div className="av">P</div>
              <div className="typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          {done && !finding && (
            <div className="done-banner">
              🎉 Perfect! Finding your personalised scholarship matches now...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        {!done && (
          <div style={{ position: "sticky", bottom: 0 }}>
            <div className="dc-input-area">
              <div className="dc-input-wrap">
                <textarea
                  className="dc-textarea"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Type your answer..."
                  rows={1}
                  disabled={loading || done}
                />
              </div>
              <button
                className="dc-send"
                onClick={() => sendMessage()}
                disabled={loading || !input.trim() || done}
              >
                ↑
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}