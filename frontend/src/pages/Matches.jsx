import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export default function Matches({ navigate, matches, sessionId, user, setProfile }) {
  const [generatingLetter, setGeneratingLetter] = useState(null);
  const [modal, setModal] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [localMatches, setLocalMatches] = useState(matches || []);
  const [initialLoad, setInitialLoad] = useState(true);

  // Load initial matches on mount if none exist
  useEffect(() => {
    if (initialLoad && (!matches || matches.length === 0)) {
      regenerateMatches();
      setInitialLoad(false);
    }
  }, []);

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

  const regenerateMatches = async () => {
    setRegenerating(true);
    try {
      console.log("🔄 Fetching new matches from backend...");
      const res = await fetch(`${API_BASE}/matches/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      const newMatches = data.matches || [];
      
      console.log("📥 Backend returned:", newMatches.length, "matches");
      console.log("📋 Current local matches:", localMatches.length);

      // Keep valid old matches (non-expired)
      const today = new Date();
      const validOldMatches = localMatches.filter(oldMatch => {
        if (!oldMatch.deadline) return true;
        const deadline = new Date(oldMatch.deadline);
        return deadline >= today;
      });

      console.log("✅ Valid old matches:", validOldMatches.length);

      // Find truly new scholarships (not in valid old matches)
      const newScholarships = newMatches.filter(newMatch => 
        !validOldMatches.some(oldMatch => 
          oldMatch.title === newMatch.title && oldMatch.provider === newMatch.provider
        )
      );

      console.log("🆕 New scholarships found:", newScholarships.length);

      // Sort new scholarships by similarity (best first) and take top 2
      newScholarships.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
      const bestNewScholarships = newScholarships.slice(0, 2);

      // Combine and sort all by similarity
      const mergedMatches = [...validOldMatches, ...bestNewScholarships];
      mergedMatches.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

      console.log("📊 Final merged matches:", mergedMatches.length);

      setLocalMatches(mergedMatches);

      // Save to database
      const { error } = await supabase
        .from('student_profiles')
        .update({ 
          matches: mergedMatches, 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving matches:', error);
        alert('Matches updated but failed to save. Please try again.');
      } else {
        if (setProfile) {
          setProfile(prev => ({ ...prev, matches: mergedMatches }));
        }
        const expiredCount = localMatches.length - validOldMatches.length;
        const message = bestNewScholarships.length > 0 
          ? `✅ Added ${bestNewScholarships.length} top new matches!${expiredCount > 0 ? ` Removed ${expiredCount} expired.` : ''}`
          : `✅ All matches are valid!${expiredCount > 0 ? ` Removed ${expiredCount} expired.` : ' No new scholarships found.'}`;
        alert(message);
      }
    } catch (err) {
      console.error('Error regenerating matches:', err);
      alert('Failed to regenerate matches. Please check your connection and try again.');
    }
    setRegenerating(false);
  };

  // Show empty state if no matches
  if (localMatches.length === 0 && !regenerating) {
    return (
      <>
        <style>{`
          .matches-page { min-height: 100vh; background: var(--bg); padding-top: 60px; }
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
          .m-regenerate-bar {
            background: var(--surface); border: 1px solid var(--border);
            border-radius: 12px; padding: 16px; margin-bottom: 20px;
            display: flex; align-items: center; justify-content: space-between;
            gap: 12px; flex-wrap: wrap;
          }
          .m-regen-text { flex: 1; min-width: 200px; }
          .m-regen-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
          .m-regen-desc { font-size: 12px; color: var(--text2); line-height: 1.5; }
          .btn-regenerate {
            background: var(--accent); color: white; border: none;
            font-size: 13px; font-weight: 600; padding: 10px 20px;
            border-radius: 9px; font-family: inherit; transition: all 0.2s;
            white-space: nowrap;
          }
          .btn-regenerate:hover:not(:disabled) { background: var(--accent2); }
          .btn-regenerate:disabled { opacity: 0.6; cursor: not-allowed; }
        `}</style>
        <div className="matches-page">
          <div className="m-hero">
            <div className="m-hero-badge">🎯 Finding Your Matches</div>
            <div className="m-hero-title">No matches yet</div>
            <div className="m-hero-sub">Click regenerate to find scholarships that match your profile</div>
          </div>
          <div className="m-content">
            <div className="m-regenerate-bar">
              <div className="m-regen-text">
                <div className="m-regen-title">🔄 Generate your first matches</div>
                <div className="m-regen-desc">
                  We'll search the database for scholarships that fit your profile
                </div>
              </div>
              <button 
                className="btn-regenerate" 
                onClick={regenerateMatches}
                disabled={regenerating}
              >
                {regenerating ? "⏳ Searching..." : "🔍 Find Matches"}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        .matches-page { min-height: 100vh; background: var(--bg); padding-top: 60px; }

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

        .m-regenerate-bar {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 16px; margin-bottom: 20px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap;
        }
        .m-regen-text {
          flex: 1; min-width: 200px;
        }
        .m-regen-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
        .m-regen-desc { font-size: 12px; color: var(--text2); line-height: 1.5; }
        .btn-regenerate {
          background: var(--accent); color: white; border: none;
          font-size: 13px; font-weight: 600; padding: 10px 20px;
          border-radius: 9px; font-family: inherit; transition: all 0.2s;
          white-space: nowrap;
        }
        .btn-regenerate:hover:not(:disabled) { background: var(--accent2); }
        .btn-regenerate:disabled { opacity: 0.6; cursor: not-allowed; }

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
        {/* HERO */}
        <div className="m-hero">
          <div className="m-hero-badge">🎯 Your Results Are Ready</div>
          <div className="m-hero-title">
            {localMatches.length} scholarship{localMatches.length !== 1 ? "s" : ""} matched to your profile
          </div>
          <div className="m-hero-sub">Based on your academics, activities, and hidden achievements</div>
        </div>

        {/* MATCHES */}
        <div className="m-content">
          {/* REGENERATE BAR */}
          <div className="m-regenerate-bar">
            <div className="m-regen-text">
              <div className="m-regen-title">🔄 Keep your matches fresh</div>
              <div className="m-regen-desc">
                Regenerate to find new scholarships while keeping your existing valid matches
              </div>
            </div>
            <button 
              className="btn-regenerate" 
              onClick={regenerateMatches}
              disabled={regenerating}
            >
              {regenerating ? "⏳ Updating..." : "🔄 Regenerate Matches"}
            </button>
          </div>

          <div className="m-section-title">
            🏆 Your Top Matches
          </div>

          {localMatches.map((s, i) => (
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
