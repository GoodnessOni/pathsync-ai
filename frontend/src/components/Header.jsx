import { useState } from "react";

export default function Header({ user, navigate }) {
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) return null;

  const initials = user.email?.charAt(0).toUpperCase() || "U";

  return (
    <>
      <style>{`
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          padding: 12px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 1000;
          box-shadow: var(--shadow);
        }
        .header-logo {
          font-size: 20px;
          font-weight: 800;
          color: var(--text);
          cursor: pointer;
        }
        .header-logo span {
          color: var(--accent);
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .header-link {
          font-size: 14px;
          color: var(--text2);
          text-decoration: none;
          transition: color 0.2s;
        }
        .header-link:hover {
          color: var(--accent);
        }
        .header-btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          border: 1.5px solid var(--border);
          background: var(--bg);
          color: var(--text2);
          transition: all 0.2s;
          cursor: pointer;
        }
        .header-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        .header-cta {
          padding: 8px 18px;
          border-radius: 8px;
          background: var(--accent);
          color: white;
          font-size: 14px;
          font-weight: 600;
          border: none;
          transition: all 0.2s;
        }
        .header-cta:hover {
          background: var(--accent2);
          transform: translateY(-1px);
        }
        .header-user {
          position: relative;
        }
        .header-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--accent);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .header-avatar:hover {
          transform: scale(1.05);
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.2);
        }
        .header-dropdown {
          position: absolute;
          top: 50px;
          right: 0;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: var(--shadow-lg);
          min-width: 200px;
          overflow: hidden;
        }
        .dropdown-item {
          padding: 12px 16px;
          color: var(--text);
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }
        .dropdown-item:hover {
          background: var(--bg2);
        }
        .dropdown-email {
          padding: 12px 16px;
          font-size: 13px;
          color: var(--text2);
          border-bottom: 1px solid var(--border);
        }
        .page-content {
          padding-top: 60px;
        }
      `}</style>

      <div className="header">
        <div className="header-logo" onClick={() => navigate("landing")}>
          Path<span>Sync</span> AI
        </div>
        
        <div className="header-right">
          <a 
            href="https://naija-opportunities.vercel.app" 
            target="_blank" 
            rel="noreferrer" 
            className="header-link"
          >
            NaijaOpportunities
          </a>
          <button className="header-btn" onClick={() => navigate("onboard")}>
            New Search
          </button>
          <button className="header-cta" onClick={() => navigate("dashboard")}>
            Dashboard
          </button>
          
          <div className="header-user">
            <div className="header-avatar" onClick={() => setShowDropdown(!showDropdown)}>
              {initials}
            </div>
            {showDropdown && (
              <div className="header-dropdown">
                <div className="dropdown-email">{user.email}</div>
                <button className="dropdown-item" onClick={() => { navigate("profile"); setShowDropdown(false); }}>
                  View Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
