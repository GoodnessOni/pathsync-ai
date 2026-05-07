import { supabase } from "../lib/supabase";

export default function Header({ user }) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (!user) return null;

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
        }
        .header-logo span {
          color: var(--accent);
        }
        .header-user {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .header-email {
          font-size: 14px;
          color: var(--text2);
        }
        .header-signout {
          padding: 8px 16px;
          border-radius: 8px;
          background: var(--bg2);
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .header-signout:hover {
          background: var(--danger);
          color: white;
          border-color: var(--danger);
        }
        .page-content {
          padding-top: 60px;
        }
      `}</style>

      <div className="header">
        <div className="header-logo">
          Path<span>Sync</span> AI
        </div>
        <div className="header-user">
          <span className="header-email">{user.email}</span>
          <button className="header-signout" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
