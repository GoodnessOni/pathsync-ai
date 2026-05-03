import { useState } from "react";
import Landing from "./pages/Landing";
import Onboard from "./pages/Onboard";
import Discover from "./pages/Discover";
import Matches from "./pages/Matches";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [page, setPage] = useState("landing");
  const [profile, setProfile] = useState({});
  const [sessionId] = useState(
    () => "ps_" + Math.random().toString(36).slice(2) + Date.now().toString(36)
  );
  const [matches, setMatches] = useState([]);

  const navigate = (to, data = {}) => {
    if (data.profile) setProfile((prev) => ({ ...prev, ...data.profile }));
    if (data.matches) setMatches(data.matches);
    setPage(to);
    window.scrollTo(0, 0);
  };

  const props = { navigate, profile, sessionId, matches, setProfile };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

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
          --gold: #d97706;
          --navy: #1e3a5f;
          --danger: #dc2626;
          --radius: 12px;
          --shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
          --shadow-md: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06);
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
            --gold: #f59e0b;
            --navy: #93c5fd;
            --shadow: 0 1px 3px rgba(0,0,0,0.3);
            --shadow-md: 0 4px 6px rgba(0,0,0,0.3);
            --shadow-lg: 0 10px 15px rgba(0,0,0,0.3);
          }
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-height: 100vh;
          line-height: 1.6;
        }

        button { cursor: pointer; font-family: inherit; }
        a { text-decoration: none; color: inherit; }
        input, textarea, select { font-family: inherit; }
      `}</style>

      {page === "landing" && <Landing {...props} />}
      {page === "onboard" && <Onboard {...props} />}
      {page === "discover" && <Discover {...props} />}
      {page === "matches" && <Matches {...props} />}
      {page === "dashboard" && <Dashboard {...props} />}
    </>
  );
}