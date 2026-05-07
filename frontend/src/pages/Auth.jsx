import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Auth({ onAuthSuccess }) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
    } else {
      onAuthSuccess();
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        :root {
          --bg: #ffffff;
          --bg2: #f8fafc;
          --surface: #ffffff;
          --border: #e2e8f0;
          --text: #0f172a;
          --text2: #475569;
          --muted: #94a3b8;
          --accent: #16a34a;
          --accent2: #15803d;
          --shadow: 0 1px 3px rgba(0,0,0,0.08);
          --shadow-lg: 0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.05);
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #0a0f1e;
            --bg2: #111827;
            --surface: #1a2235;
            --border: #1e2d45;
            --text: #f1f5f9;
            --text2: #94a3b8;
            --muted: #475569;
            --accent: #22c55e;
            --accent2: #16a34a;
            --shadow: 0 1px 3px rgba(0,0,0,0.3);
            --shadow-lg: 0 10px 15px rgba(0,0,0,0.3);
          }
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
          background: var(--bg);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .auth-page {
          min-height: 100vh;
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .auth-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 48px;
          width: 100%;
          max-width: 440px;
          box-shadow: var(--shadow-lg);
        }

        .auth-logo {
          font-size: 32px;
          font-weight: 800;
          text-align: center;
          margin-bottom: 12px;
          color: var(--text);
        }

        .auth-logo span {
          color: var(--accent);
        }

        .auth-subtitle {
          text-align: center;
          font-size: 15px;
          color: var(--text2);
          margin-bottom: 36px;
          line-height: 1.6;
        }

        .auth-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 28px;
          background: var(--bg2);
          padding: 4px;
          border-radius: 12px;
        }

        .auth-tab {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          background: none;
          border: none;
          color: var(--text2);
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
        }

        .auth-tab.active {
          background: var(--surface);
          color: var(--accent);
          box-shadow: var(--shadow);
        }

        .auth-google {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: 1.5px solid var(--border);
          background: var(--bg);
          color: var(--text);
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 24px;
        }

        .auth-google:hover:not(:disabled) {
          border-color: var(--accent);
          background: var(--bg2);
          transform: translateY(-1px);
        }

        .auth-google:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .auth-divider {
          text-align: center;
          color: var(--muted);
          font-size: 13px;
          margin: 24px 0;
          position: relative;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: "";
          position: absolute;
          top: 50%;
          width: 42%;
          height: 1px;
          background: var(--border);
        }

        .auth-divider::before { left: 0; }
        .auth-divider::after { right: 0; }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .auth-input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1.5px solid var(--border);
          background: var(--bg);
          color: var(--text);
          font-size: 15px;
          font-family: inherit;
          transition: all 0.2s;
          outline: none;
        }

        .auth-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
        }

        .auth-input::placeholder {
          color: var(--muted);
        }

        .auth-submit {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          background: var(--accent);
          color: white;
          border: none;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }

        .auth-submit:hover:not(:disabled) {
          background: var(--accent2);
          transform: translateY(-1px);
        }

        .auth-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .auth-error {
          background: #fee2e2;
          color: #991b1b;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          margin-top: 16px;
          border: 1px solid #fecaca;
        }

        @media (prefers-color-scheme: dark) {
          .auth-error {
            background: rgba(239, 68, 68, 0.15);
            color: #f87171;
            border-color: rgba(239, 68, 68, 0.3);
          }
        }
      `}</style>

      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            Path<span>Sync</span> AI
          </div>
          <div className="auth-subtitle">
            Sign in to save your profile and access your scholarships from anywhere
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === "signin" ? "active" : ""}`}
              onClick={() => setMode("signin")}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${mode === "signup" ? "active" : ""}`}
              onClick={() => setMode("signup")}
            >
              Sign Up
            </button>
          </div>

          <button className="auth-google" onClick={handleGoogleSignIn} disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 18 18">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
              />
            </svg>
            {loading ? "Loading..." : "Continue with Google"}
          </button>

          <div className="auth-divider">or</div>

          <form className="auth-form" onSubmit={handleEmailAuth}>
            <input
              className="auth-input"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <input
              className="auth-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Loading..." : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {error && <div className="auth-error">{error}</div>}
        </div>
      </div>
    </>
  );
}
