import { useState } from "react";

const NIGERIAN_UNIVERSITIES = [
  "University of Lagos (UNILAG)",
  "University of Ibadan (UI)",
  "Obafemi Awolowo University (OAU)",
  "University of Nigeria Nsukka (UNN)",
  "Ahmadu Bello University (ABU)",
  "University of Benin (UNIBEN)",
  "Federal University of Technology Akure (FUTA)",
  "Lagos State University (LASU)",
  "Covenant University",
  "Babcock University",
  "Landmark University",
  "Pan-Atlantic University",
  "American University of Nigeria",
  "Redeemer's University",
  "Other",
];

const COURSES = [
  "Computer Science", "Engineering (Electrical)", "Engineering (Mechanical)",
  "Engineering (Civil)", "Engineering (Chemical)", "Engineering (Petroleum)",
  "Medicine & Surgery", "Pharmacy", "Nursing", "Law", "Economics",
  "Accounting", "Business Administration", "Mass Communication",
  "Political Science", "Sociology", "Psychology", "Education",
  "Agriculture", "Architecture", "Mathematics", "Physics", "Chemistry",
  "Biology", "Biochemistry", "Microbiology", "Other",
];

export default function Onboard({ navigate, setProfile }) {
  const [step, setStep] = useState(1);
  const TOTAL = 7;

  const [data, setData] = useState({
    university: "",
    course: "",
    level: "",
    cgpa: "",
    cgpaScale: "5.0",
    demographics: [],
    leadership: "",
    projects: "",
    goal: "",
    about: "",
  });

  const update = (key, val) => setData(prev => ({ ...prev, [key]: val }));

  const toggleDemographic = (val) => {
    setData(prev => ({
      ...prev,
      demographics: prev.demographics.includes(val)
        ? prev.demographics.filter(d => d !== val)
        : [...prev.demographics, val],
    }));
  };

  const canNext = () => {
    if (step === 1) return data.university && data.course;
    if (step === 2) return data.level && data.cgpa;
    if (step === 3) return true;
    if (step === 4) return data.leadership.trim().length > 0;
    if (step === 5) return data.projects.trim().length > 0;
    if (step === 6) return data.goal;
    if (step === 7) return data.about.trim().length > 10;
    return false;
  };

  const handleNext = () => {
    if (step < TOTAL) {
      setStep(s => s + 1);
    } else {
      setProfile(data);
      navigate("discover", { profile: data });
    }
  };

  const progress = (step / TOTAL) * 100;

  return (
    <>
      <style>{`
        .onboard {
          min-height: 100vh; background: var(--bg);
          display: flex; flex-direction: column;
        }

        /* TOP BAR */
        .ob-topbar {
          padding: 16px 24px;
          display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
        }
        .ob-logo { font-size: 16px; font-weight: 800; color: var(--text); }
        .ob-logo span { color: var(--accent); }
        .ob-step-label { font-size: 12px; color: var(--text2); font-weight: 500; }

        /* PROGRESS */
        .ob-progress-bar {
          height: 3px; background: var(--border);
          position: relative;
        }
        .ob-progress-fill {
          height: 100%; background: var(--accent);
          transition: width 0.4s ease; border-radius: 0 2px 2px 0;
        }

        /* CONTENT */
        .ob-content {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 40px 24px;
        }
        .ob-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 36px; width: 100%; max-width: 520px;
          box-shadow: var(--shadow-lg);
        }
        .ob-q-num {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1.5px; color: var(--accent); margin-bottom: 8px;
        }
        .ob-q-title {
          font-size: 22px; font-weight: 800; color: var(--text);
          margin-bottom: 6px; line-height: 1.3;
        }
        .ob-q-sub {
          font-size: 13px; color: var(--text2); margin-bottom: 28px;
          line-height: 1.6;
        }

        /* INPUTS */
        .ob-select, .ob-input {
          width: 100%; padding: 13px 16px;
          border: 1.5px solid var(--border); border-radius: 10px;
          background: var(--bg); color: var(--text);
          font-size: 14px; font-family: inherit;
          transition: border-color 0.2s; outline: none; margin-bottom: 12px;
        }
        .ob-select:focus, .ob-input:focus { border-color: var(--accent); }
        .ob-textarea {
          width: 100%; padding: 13px 16px;
          border: 1.5px solid var(--border); border-radius: 10px;
          background: var(--bg); color: var(--text);
          font-size: 14px; font-family: inherit;
          transition: border-color 0.2s; outline: none;
          resize: vertical; min-height: 120px; line-height: 1.6;
        }
        .ob-textarea:focus { border-color: var(--accent); }
        .ob-textarea::placeholder, .ob-input::placeholder { color: var(--muted); }
        .char-count { font-size: 11px; color: var(--muted); text-align: right; margin-top: 4px; }

        /* BUTTON GROUPS */
        .btn-group { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .btn-option {
          padding: 10px 18px; border-radius: 10px;
          border: 1.5px solid var(--border); background: var(--bg);
          color: var(--text2); font-size: 13px; font-weight: 500;
          font-family: inherit; transition: all 0.2s; cursor: pointer;
        }
        .btn-option:hover { border-color: var(--accent); color: var(--accent); }
        .btn-option.selected {
          border-color: var(--accent); background: #dcfce7; color: #15803d; font-weight: 600;
        }
        @media (prefers-color-scheme: dark) {
          .btn-option.selected { background: rgba(34,197,94,0.15); color: #4ade80; }
        }

        /* CGPA ROW */
        .cgpa-row { display: flex; gap: 10px; }
        .cgpa-row .ob-input { flex: 1; margin-bottom: 0; }
        .cgpa-row .ob-select { width: 120px; margin-bottom: 0; }

        /* FOOTER */
        .ob-footer {
          padding: 20px 24px;
          display: flex; align-items: center; justify-content: space-between;
          border-top: 1px solid var(--border); background: var(--surface);
        }
        .ob-back {
          background: none; border: 1.5px solid var(--border);
          color: var(--text2); padding: 10px 20px; border-radius: 10px;
          font-size: 13px; font-weight: 500; font-family: inherit;
          transition: all 0.2s;
        }
        .ob-back:hover { border-color: var(--text2); color: var(--text); }
        .ob-next {
          background: var(--accent); color: white; border: none;
          padding: 12px 28px; border-radius: 10px;
          font-size: 14px; font-weight: 700; font-family: inherit;
          transition: all 0.2s; box-shadow: 0 4px 12px rgba(22,163,74,0.3);
        }
        .ob-next:hover:not(:disabled) { background: var(--accent2); transform: translateY(-1px); }
        .ob-next:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

        .ob-skip {
          font-size: 12px; color: var(--muted); background: none;
          border: none; font-family: inherit; text-decoration: underline;
        }
        .ob-skip:hover { color: var(--text2); }

        /* SUGGESTION CHIPS */
        .suggestions { margin-bottom: 12px; }
        .suggestions-label { font-size: 11px; color: var(--muted); margin-bottom: 6px; }
        .chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .chip {
          padding: 5px 12px; border-radius: 20px;
          border: 1px solid var(--border); background: var(--bg2);
          color: var(--text2); font-size: 12px; font-family: inherit;
          cursor: pointer; transition: all 0.2s;
        }
        .chip:hover { border-color: var(--accent); color: var(--accent); background: #dcfce7; }
        @media (prefers-color-scheme: dark) {
          .chip:hover { background: rgba(34,197,94,0.1); }
        }
      `}</style>

      <div className="onboard">
        {/* TOP BAR */}
        <div className="ob-topbar">
          <div className="ob-logo">Path<span>Sync</span> AI</div>
          <div className="ob-step-label">Step {step} of {TOTAL}</div>
        </div>

        {/* PROGRESS BAR */}
        <div className="ob-progress-bar">
          <div className="ob-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* CARD */}
        <div className="ob-content">
          <div className="ob-card">

            {/* STEP 1 — Course + University */}
            {step === 1 && (
              <>
                <div className="ob-q-num">Question 1 of 7 — Academics</div>
                <div className="ob-q-title">🎓 What are you studying and where?</div>
                <div className="ob-q-sub">This helps us find scholarships specific to your course and institution.</div>
                <select className="ob-select" value={data.university} onChange={e => update("university", e.target.value)}>
                  <option value="">Select your university</option>
                  {NIGERIAN_UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <select className="ob-select" value={data.course} onChange={e => update("course", e.target.value)}>
                  <option value="">Select your course</option>
                  {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </>
            )}

            {/* STEP 2 — Level + CGPA */}
            {step === 2 && (
              <>
                <div className="ob-q-num">Question 2 of 7 — Results</div>
                <div className="ob-q-title">📊 What level are you and what's your CGPA?</div>
                <div className="ob-q-sub">Your CGPA unlocks scholarships with minimum grade requirements.</div>
                <div className="btn-group">
                  {["100L", "200L", "300L", "400L", "500L", "Postgraduate"].map(l => (
                    <button key={l} className={`btn-option ${data.level === l ? "selected" : ""}`}
                      onClick={() => update("level", l)}>{l}</button>
                  ))}
                </div>
                <div className="cgpa-row" style={{ marginTop: 8 }}>
                  <input className="ob-input" type="number" step="0.01" min="0" max="5"
                    placeholder="e.g 4.20" value={data.cgpa}
                    onChange={e => update("cgpa", e.target.value)} />
                  <select className="ob-select" value={data.cgpaScale}
                    onChange={e => update("cgpaScale", e.target.value)}>
                    <option value="5.0">Out of 5.0</option>
                    <option value="4.0">Out of 4.0</option>
                  </select>
                </div>
              </>
            )}

            {/* STEP 3 — Demographics */}
            {step === 3 && (
              <>
                <div className="ob-q-num">Question 3 of 7 — Background</div>
                <div className="ob-q-title">🌍 Do any of these apply to you?</div>
                <div className="ob-q-sub">Some scholarships are specifically for these groups. Select all that apply — or skip if none apply.</div>
                <div className="btn-group">
                  {[
                    "Female student", "Student with disability",
                    "First-generation student", "From a low-income family",
                    "From Northern Nigeria", "From Niger Delta region",
                    "From rural area", "None of these",
                  ].map(d => (
                    <button key={d}
                      className={`btn-option ${data.demographics.includes(d) ? "selected" : ""}`}
                      onClick={() => toggleDemographic(d)}>{d}</button>
                  ))}
                </div>
              </>
            )}

            {/* STEP 4 — Leadership */}
            {step === 4 && (
              <>
                <div className="ob-q-num">Question 4 of 7 — Leadership</div>
                <div className="ob-q-title">🏆 Any leadership roles or clubs?</div>
                <div className="ob-q-sub">Class rep, fellowship president, sports captain, student union — anything counts. Don't undersell yourself.</div>
                <div className="suggestions">
                  <div className="suggestions-label">Quick suggestions — tap to add:</div>
                  <div className="chips">
                    {["Class representative", "Fellowship/church leader", "Club president", "Sports captain", "Student union member", "Departmental executive"].map(s => (
                      <button key={s} className="chip"
                        onClick={() => update("leadership", data.leadership ? data.leadership + ", " + s : s)}>
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea className="ob-textarea"
                  placeholder="e.g. I'm the class rep for 200L Computer Science and I also lead the tech team at my campus fellowship..."
                  value={data.leadership}
                  onChange={e => update("leadership", e.target.value)} />
                <div className="char-count">{data.leadership.length} characters</div>
              </>
            )}

            {/* STEP 5 — Projects */}
            {step === 5 && (
              <>
                <div className="ob-q-num">Question 5 of 7 — Activities</div>
                <div className="ob-q-title">💡 Side projects, business, or volunteering?</div>
                <div className="ob-q-sub">Tutoring, small business, content creation, community work — tell us everything. This is where your hidden achievements live.</div>
                <div className="suggestions">
                  <div className="suggestions-label">Quick suggestions:</div>
                  <div className="chips">
                    {["Tutoring students", "Running a small business", "Social media management", "Community volunteering", "Content creation", "Teaching Sunday school"].map(s => (
                      <button key={s} className="chip"
                        onClick={() => update("projects", data.projects ? data.projects + ", " + s : s)}>
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea className="ob-textarea"
                  placeholder="e.g. I tutor 15 students in Data Structures every semester, I manage my church's Instagram page, and I sell phone accessories on campus..."
                  value={data.projects}
                  onChange={e => update("projects", e.target.value)} />
                <div className="char-count">{data.projects.length} characters</div>
              </>
            )}

            {/* STEP 6 — Goal */}
            {step === 6 && (
              <>
                <div className="ob-q-num">Question 6 of 7 — Your Goal</div>
                <div className="ob-q-title">🎯 What's your biggest goal right now?</div>
                <div className="ob-q-sub">This tells PathSync AI what kind of scholarships to prioritise for you.</div>
                <div className="btn-group" style={{ flexDirection: "column" }}>
                  {[
                    { val: "fund_education", label: "💰 Fund my education — cover tuition and living costs" },
                    { val: "study_abroad", label: "✈️ Study abroad — get international exposure and education" },
                    { val: "build_career", label: "🚀 Build my career — access mentorship and industry networks" },
                  ].map(g => (
                    <button key={g.val}
                      className={`btn-option ${data.goal === g.val ? "selected" : ""}`}
                      style={{ textAlign: "left", padding: "14px 18px" }}
                      onClick={() => update("goal", g.val)}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* STEP 7 — About yourself */}
            {step === 7 && (
              <>
                <div className="ob-q-num">Question 7 of 7 — Your Story</div>
                <div className="ob-q-title">✨ Tell PathSync AI about yourself</div>
                <div className="ob-q-sub">
                  This is your moment. Tell us anything — your background, your struggles,
                  what drives you, what makes you different. The things you'd never think
                  to put on a form. This is where the magic happens.
                </div>
                <textarea className="ob-textarea" style={{ minHeight: 150 }}
                  placeholder="e.g. I'm a first-generation university student from Kano. My parents are traders and I got into UNILAG on my own. I started a small business selling food on campus to pay for my data subscription. I want to be a software engineer and build things that matter for Nigeria..."
                  value={data.about}
                  onChange={e => update("about", e.target.value)} />
                <div className="char-count">{data.about.length} characters — more detail = better matches</div>
              </>
            )}

          </div>
        </div>

        {/* FOOTER NAV */}
        <div className="ob-footer">
          <button className="ob-back"
            onClick={() => step === 1 ? navigate("landing") : setStep(s => s - 1)}>
            ← {step === 1 ? "Home" : "Back"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {step === 3 && (
              <button className="ob-skip" onClick={() => setStep(s => s + 1)}>
                Skip this step
              </button>
            )}
            <button className="ob-next" disabled={!canNext()} onClick={handleNext}>
              {step === TOTAL ? "Find My Scholarships 🎯" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}