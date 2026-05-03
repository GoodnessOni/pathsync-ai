import React from 'react';

export default function Landing({ navigate }) {
  return (
    <>
      <style>{`
        .landing { min-height: 100vh; }

        /* NAV */
        .nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 24px; border-bottom: 1px solid var(--border);
          background: var(--surface); position: sticky; top: 0; z-index: 50;
        }
        .nav-logo { font-size: 18px; font-weight: 800; color: var(--text); }
        .nav-logo span { color: var(--accent); }
        .nav-links { display: flex; align-items: center; gap: 12px; }
        .nav-link {
          font-size: 13px; color: var(--text2); background: none;
          border: none; padding: 6px 12px; border-radius: 8px;
          transition: all 0.2s;
        }
        .nav-link:hover { background: var(--bg2); color: var(--text); }
        .nav-cta {
          font-size: 13px; font-weight: 600; color: white;
          background: var(--accent); border: none;
          padding: 8px 18px; border-radius: 8px; transition: all 0.2s;
        }
        .nav-cta:hover { background: var(--accent2); transform: translateY(-1px); }

        /* HERO */
        .hero {
          max-width: 680px; margin: 0 auto;
          padding: 80px 24px 60px; text-align: center;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: #dcfce7; color: #15803d;
          font-size: 12px; font-weight: 600;
          padding: 6px 14px; border-radius: 20px; margin-bottom: 24px;
          border: 1px solid #bbf7d0;
        }
        @media (prefers-color-scheme: dark) {
          .hero-badge { background: rgba(34,197,94,0.1); color: #4ade80; border-color: rgba(34,197,94,0.2); }
        }
        .hero-title {
          font-size: clamp(32px, 5vw, 52px); font-weight: 800;
          line-height: 1.15; margin-bottom: 20px; color: var(--text);
          letter-spacing: -0.5px;
        }
        .hero-title .green { color: var(--accent); }
        .hero-title .gold { color: var(--gold); }
        .hero-sub {
          font-size: 17px; color: var(--text2); line-height: 1.7;
          margin-bottom: 36px; max-width: 520px; margin-left: auto; margin-right: auto;
        }
        .hero-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .btn-primary {
          background: var(--accent); color: white; border: none;
          font-size: 15px; font-weight: 700; padding: 14px 32px;
          border-radius: 12px; transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(22,163,74,0.3);
        }
        .btn-primary:hover { background: var(--accent2); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(22,163,74,0.4); }
        .btn-secondary {
          background: var(--surface); color: var(--text); border: 1.5px solid var(--border);
          font-size: 15px; font-weight: 600; padding: 14px 28px;
          border-radius: 12px; transition: all 0.2s;
        }
        .btn-secondary:hover { border-color: var(--accent); color: var(--accent); }

        /* STATS */
        .stats {
          display: flex; justify-content: center; gap: 40px;
          flex-wrap: wrap; padding: 40px 24px;
          border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
          background: var(--bg2);
        }
        .stat { text-align: center; }
        .stat-num { font-size: 28px; font-weight: 800; color: var(--accent); }
        .stat-label { font-size: 12px; color: var(--text2); margin-top: 2px; }

        /* HOW IT WORKS */
        .section { max-width: 800px; margin: 0 auto; padding: 64px 24px; }
        .section-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1.5px; color: var(--accent); margin-bottom: 12px;
        }
        .section-title {
          font-size: clamp(22px, 3vw, 32px); font-weight: 800;
          color: var(--text); margin-bottom: 40px; line-height: 1.3;
        }
        .steps { display: flex; flex-direction: column; gap: 20px; }
        .step {
          display: flex; gap: 20px; align-items: flex-start;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 20px 24px;
          box-shadow: var(--shadow); transition: all 0.2s;
        }
        .step:hover { box-shadow: var(--shadow-md); border-color: var(--accent); }
        .step-num {
          width: 36px; height: 36px; border-radius: 10px;
          background: var(--accent); color: white;
          font-size: 15px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .step-body { flex: 1; }
        .step-title { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
        .step-desc { font-size: 13px; color: var(--text2); line-height: 1.6; }
        .step-time {
          font-size: 11px; font-weight: 600; color: var(--accent);
          background: #dcfce7; padding: 2px 8px; border-radius: 20px;
          margin-top: 6px; display: inline-block;
        }
        @media (prefers-color-scheme: dark) {
          .step-time { background: rgba(34,197,94,0.1); }
        }

        /* FEATURES */
        .features { background: var(--bg2); padding: 64px 24px; }
        .features-inner { max-width: 800px; margin: 0 auto; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
        .feature {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 20px;
          box-shadow: var(--shadow); transition: all 0.2s;
        }
        .feature:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .feature-icon { font-size: 28px; margin-bottom: 10px; }
        .feature-title { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
        .feature-desc { font-size: 12px; color: var(--text2); line-height: 1.6; }

        /* TRANSLATION */
        .translation { max-width: 800px; margin: 0 auto; padding: 64px 24px; }
        .translation-grid { display: flex; flex-direction: column; gap: 12px; }
        .translation-row {
          display: flex; align-items: center; gap: 12px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 16px 20px;
          box-shadow: var(--shadow);
        }
        .t-left { flex: 1; font-size: 13px; color: var(--text2); font-style: italic; }
        .t-arrow { font-size: 18px; color: var(--accent); flex-shrink: 0; }
        .t-right { flex: 1; font-size: 13px; font-weight: 600; color: var(--accent); }

        /* CTA BOTTOM */
        .cta-bottom {
          background: linear-gradient(135deg, #15803d, #16a34a);
          padding: 64px 24px; text-align: center;
        }
        .cta-bottom-title {
          font-size: clamp(22px, 3vw, 36px); font-weight: 800;
          color: white; margin-bottom: 16px; line-height: 1.3;
        }
        .cta-bottom-sub { font-size: 15px; color: rgba(255,255,255,0.85); margin-bottom: 32px; }
        .btn-white {
          background: white; color: #15803d; border: none;
          font-size: 15px; font-weight: 700; padding: 14px 36px;
          border-radius: 12px; transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(0,0,0,0.15);
        }
        .btn-white:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.2); }

        /* FOOTER */
        .footer {
          background: var(--surface); border-top: 1px solid var(--border);
          padding: 24px; text-align: center;
        }
        .footer-text { font-size: 12px; color: var(--muted); }
        .footer-link { color: var(--accent); font-weight: 600; }
      `}</style>

      <div className="landing">
        {/* NAV */}
        <nav className="nav">
          <div className="nav-logo">Path<span>Sync</span> AI</div>
          <div className="nav-links">
            <a href="https://naija-opportunities.vercel.app" target="_blank" rel="noreferrer" className="nav-link">
              NaijaOpportunities
            </a>
            <button className="nav-cta" onClick={() => navigate("onboard")}>
              Find My Scholarships →
            </button>
          </div>
        </nav>

        {/* HERO */}
        <section className="hero">
          <div className="hero-badge">
             Built for Nigerian Students
          </div>
          <h1 className="hero-title">
            Find the scholarships<br />
            you <span className="green">actually qualify</span> for.<br />
            <span className="gold">Win them too.</span>
          </h1>
          <p className="hero-sub">
            PathSync AI has a conversation with you, discovers your hidden achievements,
            matches you to real Nigerian scholarships — then writes your application
            letter, CV, and deadline tracker automatically.
          </p>
          <div className="hero-btns">
            <button className="btn-primary" onClick={() => navigate("onboard")}>
              🎓 Find My Scholarships — Free
            </button>
            <a
              href="https://naija-opportunities.vercel.app/scholarships"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
            >
              Browse Scholarships →
            </a>
          </div>
        </section>

        {/* STATS */}
        <div className="stats">
          <div className="stat">
            <div className="stat-num">1.8M</div>
            <div className="stat-label">Nigerian undergraduates</div>
          </div>
          <div className="stat">
            <div className="stat-num">₦50B+</div>
            <div className="stat-label">Unclaimed scholarship funds yearly</div>
          </div>
          <div className="stat">
            <div className="stat-num">&lt; 5 min</div>
            <div className="stat-label">To get your matches + letter</div>
          </div>
          <div className="stat">
            <div className="stat-num">Free</div>
            <div className="stat-label">To get started</div>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <section className="section">
          <div className="section-label">How it works</div>
          <div className="section-title">From profile to application<br />in under 5 minutes</div>
          <div className="steps">
            {[
              { n: 1, title: "Tell us about yourself", desc: "Answer 7 quick questions about your course, CGPA, activities, and goals. Most answers are just a tap — no long typing required.", time: "60 seconds" },
              { n: 2, title: "PathSync discovers your hidden achievements", desc: "Our AI translates your everyday experiences into formal competencies that scholarship committees actually value.", time: "30 seconds" },
              { n: 3, title: "Get your personalised matches", desc: "See your top scholarship matches with a specific reason why you qualify for each one — not generic results.", time: "Instant" },
              { n: 4, title: "Apply with everything ready", desc: "One click generates your application letter, scholarship CV, and a deadline tracker with step-by-step action plans.", time: "2 minutes" },
            ].map(s => (
              <div className="step" key={s.n}>
                <div className="step-num">{s.n}</div>
                <div className="step-body">
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                  <div className="step-time">⏱ {s.time}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <div className="features">
          <div className="features-inner">
            <div className="section-label">Features</div>
            <div className="section-title" style={{ marginBottom: 28 }}>Everything you need to win</div>
            <div className="features-grid">
              {[
                { icon: "🧠", title: "Hidden Achievement Engine", desc: "Translates your everyday activities into formal competencies scholarship committees value." },
                { icon: "🎯", title: "Smart Matching", desc: "RAG-based vector search matches your full profile — not just keywords — to real Nigerian scholarships." },
                { icon: "✉️", title: "Application Letter", desc: "Personalised, formal letter written using everything PathSync learned about you. One click." },
                { icon: "📄", title: "CV Generator", desc: "Scholarship-optimised CV built automatically from your profile. Professional from the first draft." },
                { icon: "📅", title: "Deadline Tracker", desc: "Step-by-step action plans for every match. Documents needed, days remaining, nothing missed." },
                { icon: "🔒", title: "Privacy First", desc: "Zero PII stored. Your name, NIN, and address never touch the AI. Only your Academic DNA does." },
              ].map(f => (
                <div className="feature" key={f.title}>
                  <div className="feature-icon">{f.icon}</div>
                  <div className="feature-title">{f.title}</div>
                  <div className="feature-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TRANSLATION */}
        <section className="translation">
          <div className="section-label">The Hidden Achievement Engine</div>
          <div className="section-title">We hear what you can't say about yourself</div>
          <div className="translation-grid">
            {[
              { l: '"I run a street football league"', r: 'Project Coordination & Community Leadership' },
              { l: '"I manage my church\'s social media"', r: 'Digital Communications & Community Engagement' },
              { l: '"I tutor my classmates in maths"', r: 'Peer Education, Mentorship & Curriculum Delivery' },
              { l: '"I sell provisions on campus"', r: 'Entrepreneurship & Financial Management' },
              { l: '"I\'m the class rep"', r: 'Student Government & Stakeholder Liaison' },
            ].map((t, i) => (
              <div className="translation-row" key={i}>
                <div className="t-left">{t.l}</div>
                <div className="t-arrow">→</div>
                <div className="t-right">{t.r}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA BOTTOM */}
        <div className="cta-bottom">
          <div className="cta-bottom-title">
            It finds the scholarships.<br />
            Writes the letter. Builds the CV.<br />
            Tracks every deadline.
          </div>
          <div className="cta-bottom-sub">
            It does everything except submit the application.
          </div>
          <button className="btn-white" onClick={() => navigate("onboard")}>
            Get Started — It's Free →
          </button>
        </div>

        {/* FOOTER */}
        <footer className="footer">
          <p className="footer-text">
            PathSync AI · Built by ONI Goodness Oluwapelumi·{" "}
            <a href="https://naija-opportunities.vercel.app" target="_blank" rel="noreferrer" className="footer-link">
              NaijaOpportunities
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}