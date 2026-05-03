import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export default function Matches({ navigate, matches, sessionId }) {
  const [generatingLetter, setGeneratingLetter] = useState(null);
  const [modal, setModal] = useState(null);

  const handleLetter = async (s) => {
    setGeneratingLetter(s.id);
    try {
      const res = await fetch(`${API_BASE}/generate/letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          scholarship_title: s.title,
          scholarship_provider: s.provider,
        }),
      });
      const data = await res.json();
      setModal({ title: `Application Letter — ${s.title}`, content: data.letter });
    } catch {
      setModal({ title: "Error", content: "Could not generate letter. Please try again." });
    }
    setGeneratingLetter(null);
  };

  const sampleMatches = [
    { id: "1", title: "MTN Foundation Science & Technology Scholarship", provider: "MTN Nigeria", amount: "₦200,000/year", match_reason: "Your CGPA and STEM course make you a strong candidate", similarity: 0.91, deadline: "2026-07-31", application_url: "https://mtnfoundation.org" },
    { id: "2", title: "Shell Nigeria University Scholarship", provider: "Shell Nigeria", amount: "₦500,000/year", match_reason: "Your leadership roles align perfectly with Shell's criteria", similarity: 0.87, deadline: "2026-06-30", application_url: "https://shell.com.ng" },
    { id: "3", title: "NLNG National Scholarship", provider: "NLNG", amount: "₦2,000,000/year", match_reason: "Your community engagement and academic excellence match NLNG's profile", similarity: 0.83, deadline: "2026-09-15", application_url: "https://nlng.com" },
  ];

  const displayMatches = matches?.length > 0 ? matches : sampleMatches;

  return (
    <>
      <style>{`
        .matches-page { min-height: 100vh; background: var(--bg); }
        .m-nav {
          background: var(--surface); border-bottom: 1px solid var(--border);
          padding: 14px 24px; display: flex; align-items: center; justify-content: space-between;
        }
        .m-logo { font-size: 16px; font-weight: 800; }
        .m-logo span { color: var(--accent); }

        .m-hero {
          background: linear-gradient(135deg, #15803d, #16a34a);
          padding: 48px 24px; text-align: center; color: white;
        }
        .m-hero-badge {
          display: inline-block; background: rgba(255,255,255,0.2);
          font-size: 12px; font-weight: 600; padding: 6px 16px;
          border-radius: 20px; margin-bottom: 16px;
        }
        .m-hero-title { font-size: clamp(24px,4vw,36px); font-weight: 800; margin-bottom: 10px; }
        .m-hero-sub { font-size: 15px; color: rgba(255,255,255,0.85); }

        .m-content { max-width: 680px; margin: 0 auto; padding: 32px 24px; }
        .m-section-title {
          font-size: 18px; font-weight: 800; color: var(--text);
          margin-bottom: 20px; display: flex; align-items: center; gap: 8px;
        }

        .scard {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; padding: 20px; margin-bottom: 16px;
          box-shadow: var(--shadow); transition: all 0.2s;
          animation: fadeUp 0.4s ease both;
        }
        .scard:hover { box-shadow: var(--shadow-md); border-color: var(--accent); }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scard:nth-child(2) { animation-delay: 0.1s; }
        .scard:nth-child(3) { animation-delay: 0.2s; }

        .scard-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; gap: 12px; }
        .scard-rank {
          width: 36px; height: 36px; border-radius: 10px;
          background: var(--accent); color: white;
          font-size: 16px; font-weight: 800;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .scard-info { flex: 1; }
        .scard-provider { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-bottom: 3px; }
        .scard-title { font-size: 15px; font-weight: 700; color: var(--text); line-height: 1.3; }
        .scard-match {
          font-size: 11px; font-weight: 600;
          background: #dcfce7; color: #15803d;
          padding: 4px 10px; border-radius: 20px; white-space: nowrap;
        }
        @media (prefers-color-scheme: dark) {
          .scard-match { background: rgba(34,197,94,0.15); color: #4ade80; }
        }

        .scard-reason {
          font-size: 13px; color: var(--accent); margin: 10px 0;
          padding: 8px 12px; background: #f0fdf4; border-radius: 8px;
          border-left: 3px solid var(--accent); line-height: 1.5;
        }
        @media (prefers-color-scheme: dark) {
          .scard-reason { background: rgba(34,197,94,0.08); }
        }

        .scard-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
        .scard-pill {
          font-size: 12px; padding: 4px 10px; border-radius: 20px;
          border: 1px solid var(--border); color: var(--text2);
        }
        .pill-gold { background: #fef3c7; color: #92400e; border-color: #fde68a; }
        .pill-red { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
        @media (prefers-color-scheme: dark) {
          .pill-gold { background: rgba(245,158,11,0.15); color: #fbbf24; border-color: rgba(245,158,11,0.3); }
          .pill-red { background: rgba(239,68,68,0.15); color: #f87171; border-color: rgba(239,68,68,0.3); }
        }

        .scard-btns { display: flex; gap: 8px; flex-wrap: wrap; }
        .btn-apply {
          background: var(--accent); color: white; border: none;
          font-size: 13px; font-weight: 600; padding: 9px 18px;
          border-radius: 9px; transition: all 0.2s; text-decoration: none;
          display: inline-block;
        }
        .btn-apply:hover { background: var(--accent2); }
        .btn-letter {
          background: var(--bg); color: var(--text);
          border: 1.5px solid var(--border);
          font-size: 13px; font-weight: 500; padding: 9px 18px;
          border-radius: 9px; transition: all 0.2s; font-family: inherit;
        }
        .btn-letter:hover { border-color: var(--accent); color: var(--accent); }
        .btn-letter:disabled { opacity: 0.5; cursor: not-allowed; }

        .m-dashboard-cta {
          background: var(--navy); border-radius: 14px;
          padding: 28px; text-align: center; margin-top: 8px;
          color: white;
        }
        @media (prefers-color-scheme: dark) {
          .m-dashboard-cta { background: var(--surface); border: 1px solid var(--border); }
        }
        .m-cta-title { font-size: 18px; font-weight: 800; margin-bottom: 8px; }
        .m-cta-sub { font-size: 13px; opacity: 0.85; margin-bottom: 20px; line-height: 1.6; }
        .btn-dashboard {
          background: var(--accent); color: white; border: none;
          font-size: 14px; font-weight: 700; padding: 12px 28px;
          border-radius: 10px; transition: all 0.2s; font-family: inherit;
          box-shadow: 0 4px 12px rgba(22,163,74,0.4);
        }
        .btn-dashboard:hover { background: var(--accent2); transform: translateY(-1px); }

        /* MODAL */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          display: flex; align-items: center; justify-content: center;
          z-index: 100; padding: 20px;
        }
        .modal {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; width: 100%; max-width: 600px;
          max-height: 85vh; display: flex; flex-direction: column;
          box-shadow: var(--shadow-lg);
        }
        .modal-hdr {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border-bottom: 1px solid var(--border);
        }
        .modal-title { font-size: 14px; font-weight: 700; color: var(--text); }
        .modal-close {
          background: none; border: 1px solid var(--border);
          color: var(--text2); width: 28px; height: 28px;
          border-radius: 6px; font-size: 14px; font-family: inherit;
        }
        .modal-close:hover { border-color: var(--text); color: var(--text); }
        .modal-body { flex: 1; overflow-y: auto; padding: 20px; }
        .modal-text {
          white-space: pre-wrap; font-size: 14px; line-height: 1.8;
          color: var(--text); font-family: inherit;
        }
        .modal-foot { padding: 14px 20px; border-top: 1px solid var(--border); }
        .btn-copy {
          background: var(--accent); color: white; border: none;
          padding: 10px 20px; border-radius: 9px;
          font-size: 13px; font-weight: 600; font-family: inherit;
        }
      `}</style>

      <div className="matches-page">
        {/* NAV */}
        <div className="m-nav">
          <div className="m-logo">Path<span>Sync</span> AI</div>
          <button
            style={{ background: "none", border: "1.5px solid var(--border)", color: "var(--text2)", padding: "7px 14px", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }}
            onClick={() => navigate("onboard")}
          >
            Start Over
          </button>
        </div>

        {/* HERO */}
        <div className="m-hero">
          <div className="m-hero-badge">🎯 Your Results Are Ready</div>
          <div className="m-hero-title">
            {displayMatches.length} scholarship{displayMatches.length !== 1 ? "s" : ""} matched to your profile
          </div>
          <div className="m-hero-sub">Based on your academics, activities, and hidden achievements</div>
        </div>

        {/* MATCHES */}
        <div className="m-content">
          <div className="m-section-title">
            🏆 Your Top Matches
          </div>

          {displayMatches.map((s, i) => (
            <div className="scard" key={s.id || i}>
              <div className="scard-top">
                <div className="scard-rank">{i + 1}</div>
                <div className="scard-info">
                  <div className="scard-provider">{s.provider}</div>
                  <div className="scard-title">{s.title}</div>
                </div>
                <div className="scard-match">{Math.round((s.similarity || 0.85) * 100)}% match</div>
              </div>

              {s.match_reason && (
                <div className="scard-reason">✦ {s.match_reason}</div>
              )}

              <div className="scard-meta">
                {s.amount && <span className="scard-pill pill-gold">💰 {s.amount}</span>}
                {s.deadline && (
                  <span className="scard-pill pill-red">
                    ⏰ Deadline: {new Date(s.deadline).toLocaleDateString("en-NG")}
                  </span>
                )}
              </div>

              <div className="scard-btns">
                {s.application_url && (
                  <a href={s.application_url} target="_blank" rel="noreferrer" className="btn-apply">
                    Apply Now →
                  </a>
                )}
                <button
                  className="btn-letter"
                  disabled={generatingLetter === s.id}
                  onClick={() => handleLetter(s)}
                >
                  {generatingLetter === s.id ? "⏳ Writing..." : "✉️ Write My Letter"}
                </button>
              </div>
            </div>
          ))}

          {/* DASHBOARD CTA */}
          <div className="m-dashboard-cta">
            <div className="m-cta-title">Ready to apply?</div>
            <div className="m-cta-sub">
              Get your full CV, deadline tracker, and application letters for all matches — all in one place.
            </div>
            <button className="btn-dashboard" onClick={() => navigate("dashboard")}>
              Go to My Dashboard →
            </button>
          </div>
        </div>
      </div>

      {/* LETTER MODAL */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title">{modal.title}</div>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-text">{modal.content}</div>
            </div>
            <div className="modal-foot">
              <button className="btn-copy"
                onClick={() => { navigator.clipboard.writeText(modal.content); alert("Copied!"); }}>
                📋 Copy Letter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}