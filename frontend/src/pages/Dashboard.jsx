import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export default function Dashboard({ navigate, sessionId, matches, profile, user }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [cv, setCv] = useState("");
  const [tracker, setTracker] = useState([]);
  const [loadingCv, setLoadingCv] = useState(false);
  const [loadingTracker, setLoadingTracker] = useState(false);
  const [modal, setModal] = useState(null);

  // Load CV and tracker from profile on mount
  useEffect(() => {
    if (profile?.cv) {
      setCv(profile.cv);
    }
    if (profile?.tracker) {
      setTracker(profile.tracker);
    }
  }, [profile]);

  const generateCv = async () => {
    setLoadingCv(true);
    setActiveTab("cv");
    try {
      const res = await fetch(`${API_BASE}/generate/cv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();

      const cvText = data.cv || data.content || data.text || null;

      if (!cvText) {
        setCv("PathSync could not generate your CV yet. Please complete the discovery interview first, then try again.");
        setLoadingCv(false);
        return;
      }

      setCv(cvText);

      // Save CV to database
      const { error } = await supabase
        .from('student_profiles')
        .update({ cv: cvText, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving CV:', error);
      }
    } catch (err) {
      console.error("CV generation error:", err);
      setCv("Connection error. Please check your internet and try again.");
    }
    setLoadingCv(false);
  };

  const generateTracker = async () => {
    setLoadingTracker(true);
    setActiveTab("tracker");
    try {
      const res = await fetch(`${API_BASE}/generate/tracker`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      const newTracker = data.tracker || [];
      setTracker(newTracker);

      // Save tracker to database
      const { error } = await supabase
        .from('student_profiles')
        .update({ tracker: newTracker, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving tracker:', error);
      }
    } catch {
      setTracker([]);
    }
    setLoadingTracker(false);
  };

  const generateLetter = async (s) => {
    setModal({ title: `Writing letter for ${s.title}...`, content: null });
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
  };

  const urgencyColor = { urgent: "#dc2626", moderate: "#d97706", comfortable: "#16a34a" };

  return (
    <>
      <style>{`
        .dash { min-height: 100vh; background: var(--bg); display: flex; flex-direction: column; padding-top: 60px; }

       

        /* TABS */
        .dash-tabs {
          background: var(--surface); border-bottom: 1px solid var(--border);
          padding: 0 24px; display: flex; gap: 2px;
          overflow-x: auto;
        }
        .dash-tab {
          font-size: 13px; padding: 12px 16px;
          border-bottom: 2px solid transparent;
          color: var(--text2); background: none; border-top: none;
          border-left: none; border-right: none;
          font-family: inherit; white-space: nowrap; transition: all 0.2s;
        }
        .dash-tab:hover { color: var(--text); }
        .dash-tab.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }

        /* CONTENT */
        .dash-content { flex: 1; max-width: 720px; width: 100%; margin: 0 auto; padding: 28px 24px; }

        /* OVERVIEW */
        .overview-greeting {
          background: linear-gradient(135deg, #15803d, #16a34a);
          border-radius: 14px; padding: 24px; color: white; margin-bottom: 24px;
        }
        .ov-title { font-size: 20px; font-weight: 800; margin-bottom: 6px; }
        .ov-sub { font-size: 13px; opacity: 0.85; line-height: 1.6; }

        .action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
        .action-card {
          background: var(--surface); border: 1.5px solid var(--border);
          border-radius: 12px; padding: 20px; text-align: center;
          transition: all 0.2s; box-shadow: var(--shadow);
        }
        .action-card:hover { border-color: var(--accent); box-shadow: var(--shadow-md); transform: translateY(-1px); }
        .action-icon { font-size: 28px; margin-bottom: 8px; }
        .action-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
        .action-desc { font-size: 11px; color: var(--text2); line-height: 1.5; margin-bottom: 12px; }
        .action-btn {
          background: var(--accent); color: white; border: none;
          font-size: 12px; font-weight: 600; padding: 8px 16px;
          border-radius: 8px; font-family: inherit; transition: all 0.2s; width: 100%;
        }
        .action-btn:hover { background: var(--accent2); }
        .action-btn.secondary {
          background: var(--bg2); color: var(--text);
          border: 1px solid var(--border);
        }
        .action-btn.secondary:hover { border-color: var(--accent); color: var(--accent); background: var(--bg2); }

        .matches-mini { margin-bottom: 24px; }
        .matches-mini-title { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 12px; }
        .mini-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 10px; padding: 14px 16px; margin-bottom: 8px;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          transition: all 0.2s;
        }
        .mini-card:hover { border-color: var(--accent); }
        .mini-info { flex: 1; min-width: 0; }
        .mini-provider { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); }
        .mini-title { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mini-amount { font-size: 12px; color: var(--gold); font-weight: 600; white-space: nowrap; }
        .mini-btn {
          background: none; border: 1px solid var(--border);
          color: var(--text2); font-size: 11px; padding: 5px 10px;
          border-radius: 7px; font-family: inherit; white-space: nowrap; transition: all 0.2s;
        }
        .mini-btn:hover { border-color: var(--accent); color: var(--accent); }

        /* CV */
        .cv-actions { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .cv-btn {
          background: var(--accent); color: white; border: none;
          padding: 9px 18px; border-radius: 9px;
          font-size: 13px; font-weight: 600; font-family: inherit; transition: all 0.2s;
        }
        .cv-btn:hover { background: var(--accent2); }
        .cv-btn.outline {
          background: none; color: var(--text);
          border: 1.5px solid var(--border);
        }
        .cv-btn.outline:hover { border-color: var(--accent); color: var(--accent); }
        .cv-body {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 24px;
          font-size: 13px; line-height: 1.9; color: var(--text);
          white-space: pre-wrap; font-family: inherit;
          min-height: 300px;
        }
        .loading-box {
          display: flex; align-items: center; justify-content: center;
          flex-direction: column; gap: 12px; padding: 60px 0;
          color: var(--text2); font-size: 14px;
        }
        .spinner {
          width: 32px; height: 32px;
          border: 2px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%; animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .empty-state { padding: 60px 0; text-align: center; color: var(--text2); font-size: 14px; }

        /* TRACKER */
        .tcard {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 20px; margin-bottom: 14px;
          box-shadow: var(--shadow);
        }
        .tcard-hdr { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; gap: 12px; }
        .tc-provider { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-bottom: 2px; }
        .tc-title { font-size: 14px; font-weight: 700; color: var(--text); }
        .tc-badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
        .tc-steps { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
        .tc-step { display: flex; gap: 10px; align-items: flex-start; }
        .tc-step-num {
          width: 20px; height: 20px; border-radius: 50%;
          background: rgba(22,163,74,0.15); color: var(--accent);
          font-size: 10px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;
        }
        .tc-step-text { font-size: 13px; color: var(--text); line-height: 1.5; }
        .tc-docs { font-size: 12px; color: var(--text2); margin-bottom: 8px; }
        .tc-docs strong { color: var(--text); }
        .tc-tip {
          font-size: 12px; color: var(--gold); line-height: 1.5;
          background: rgba(217,119,6,0.08); border: 1px solid rgba(217,119,6,0.2);
          border-radius: 8px; padding: 8px 12px;
        }

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
        .modal-body { flex: 1; overflow-y: auto; padding: 20px; }
        .modal-text { white-space: pre-wrap; font-size: 14px; line-height: 1.8; color: var(--text); }
        .modal-foot { padding: 14px 20px; border-top: 1px solid var(--border); display: flex; gap: 8px; }
        .btn-copy {
          background: var(--accent); color: white; border: none;
          padding: 9px 18px; border-radius: 9px;
          font-size: 13px; font-weight: 600; font-family: inherit;
        }
      `}</style>

      <div className="dash">
        

        {/* TABS */}
        <div className="dash-tabs">
          {[
  { id: "overview", label: "🏠 Overview" },
  { id: "matches", label: "🎯 Matches", isLink: true },
  { id: "cv", label: "📄 My CV" },
  { id: "tracker", label: "📅 Deadlines" },
].map(t => (
  <button key={t.id} 
    className={`dash-tab ${activeTab === t.id ? "active" : ""}`}
    onClick={() => t.isLink ? navigate("matches") : setActiveTab(t.id)}>
    {t.label}
  </button>
))}

        </div>

        <div className="dash-content">

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <>
              <div className="overview-greeting">
                <div className="ov-title">Your scholarship dashboard is ready 🎉</div>
                <div className="ov-sub">
                  {matches?.length > 0
                    ? `We found ${matches.length} scholarships that match your profile. Generate your CV and application letters below.`
                    : "Generate your CV, application letters, and deadline tracker below."
                  }
                </div>
              </div>

              <div className="action-grid">
                <div className="action-card">
                  <div className="action-icon">📄</div>
                  <div className="action-title">Generate My CV</div>
                  <div className="action-desc">Scholarship-optimised CV built from your profile and activities</div>
                  <button className="action-btn" onClick={generateCv}>
                    {loadingCv ? "⏳ Generating..." : cv ? "🔄 Regenerate CV" : "Generate CV"}
                  </button>
                </div>
                <div className="action-card">
                  <div className="action-icon">📅</div>
                  <div className="action-title">Deadline Tracker</div>
                  <div className="action-desc">Step-by-step action plans for every matched scholarship</div>
                  <button className="action-btn" onClick={generateTracker}>
                    {loadingTracker ? "⏳ Loading..." : tracker.length > 0 ? "🔄 Refresh Tracker" : "View Tracker"}
                  </button>
                </div>
              </div>

              {matches?.length > 0 && (
                <div className="matches-mini">
                  <div className="matches-mini-title">Your Matched Scholarships</div>
                  {matches.map((s, i) => (
                    <div className="mini-card" key={i}>
                      <div className="mini-info">
                        <div className="mini-provider">{s.provider}</div>
                        <div className="mini-title">{s.title}</div>
                      </div>
                      {s.amount && <div className="mini-amount">💰 {s.amount}</div>}
                      <button className="mini-btn" onClick={() => generateLetter(s)}>
                        ✉️ Write Letter
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{
                background: "var(--bg2)", border: "1px solid var(--border)",
                borderRadius: 12, padding: 20, textAlign: "center"
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                  Browse more scholarships
                </div>
                <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>
                  NaijaOpportunities updates daily with new scholarships and jobs
                </div>
                <a
                  href="https://naija-opportunities.vercel.app/scholarships"
                  target="_blank" rel="noreferrer"
                  style={{
                    display: "inline-block", background: "var(--navy)", color: "white",
                    fontSize: 13, fontWeight: 600, padding: "9px 20px",
                    borderRadius: 9, textDecoration: "none"
                  }}
                >
                  Browse Scholarships →
                </a>
              </div>
            </>
          )}

          {/* CV TAB */}
          {activeTab === "cv" && (
            <>
              <div className="cv-actions">
                {cv && !cv.startsWith("PathSync could not") && !cv.startsWith("Connection") && (
                  <>
                    <button className="cv-btn" onClick={generateCv}>
                      🔄 Regenerate CV
                    </button>
                    <button className="cv-btn outline"
                      onClick={() => {
                        if (!cv) {
                          alert("CV not ready yet. Please generate it first.");
                          return;
                        }
                        navigator.clipboard.writeText(cv)
                          .then(() => alert("CV copied to clipboard!"))
                          .catch(() => {
                            const el = document.createElement("textarea");
                            el.value = cv;
                            document.body.appendChild(el);
                            el.select();
                            document.execCommand("copy");
                            document.body.removeChild(el);
                            alert("CV copied!");
                          });
                      }}>
                      📋 Copy CV
                    </button>
                  </>
                )}
              </div>
              {loadingCv
                ? <div className="loading-box"><div className="spinner" />Generating your CV from your profile...</div>
                : cv
                  ? <div className="cv-body" dangerouslySetInnerHTML={{ __html: cv
  .replace(/^# (.+)$/gm, '<h2 style="font-size:18px;font-weight:800;margin:16px 0 8px">$1</h2>')
  .replace(/^## (.+)$/gm, '<h3 style="font-size:14px;font-weight:700;margin:12px 0 6px;color:var(--accent)">$1</h3>')
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/^---$/gm, '<hr style="border-color:var(--border);margin:12px 0"/>')
  .replace(/\n/g, '<br/>')
}} />
                  : <div className="empty-state">Click "Generate My CV" to create your scholarship-optimised CV</div>
              }
            </>
          )}

          {/* TRACKER TAB */}
          {activeTab === "tracker" && (
            <>
              <div className="cv-actions">
                <button className="cv-btn" onClick={generateTracker} disabled={loadingTracker}>
                  {loadingTracker ? "⏳ Loading..." : tracker.length > 0 ? "🔄 Refresh" : "📅 Generate Tracker"}
                </button>
              </div>
              {loadingTracker
                ? <div className="loading-box"><div className="spinner" />Building your deadline tracker...</div>
                : tracker.length > 0
                  ? tracker.map((item, i) => (
                      <div className="tcard" key={i}>
                        <div className="tcard-hdr">
                          <div>
                            <div className="tc-provider">{item.provider}</div>
                            <div className="tc-title">{item.title}</div>
                          </div>
                          <div className="tc-badge" style={{
                            background: `${urgencyColor[item.urgency] || "#16a34a"}22`,
                            color: urgencyColor[item.urgency] || "#16a34a",
                            border: `1px solid ${urgencyColor[item.urgency] || "#16a34a"}44`,
                          }}>
                            {item.days_left} days left
                          </div>
                        </div>
                        <div className="tc-steps">
                          {(item.steps || []).map((step, j) => (
                            <div className="tc-step" key={j}>
                              <div className="tc-step-num">{j + 1}</div>
                              <div className="tc-step-text">{step}</div>
                            </div>
                          ))}
                        </div>
                        {item.documents_needed?.length > 0 && (
                          <div className="tc-docs">
                            <strong>Documents needed: </strong>
                            {Array.isArray(item.documents_needed)
                              ? item.documents_needed.join(", ")
                              : item.documents_needed}
                          </div>
                        )}
                        {item.tip && <div className="tc-tip">💡 {item.tip}</div>}
                      </div>
                    ))
                  : <div className="empty-state">Click "Generate Tracker" to see your step-by-step application plan</div>
              }
            </>
          )}
        </div>
      </div>

      {/* MODAL */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <div className="modal-title">{modal.title}</div>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {modal.content
                ? <div className="modal-text">{modal.content}</div>
                : <div className="loading-box"><div className="spinner" />Writing your letter...</div>
              }
            </div>
            {modal.content && (
              <div className="modal-foot">
                <button className="btn-copy"
                  onClick={() => { navigator.clipboard.writeText(modal.content); alert("Copied!"); }}>
                  📋 Copy Letter
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
