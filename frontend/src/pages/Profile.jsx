import { supabase } from "../lib/supabase";

export default function Profile({ user, navigate }) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <>
      <style>{`
        .profile-page {
          min-height: 100vh;
          background: var(--bg);
          padding: 40px 24px;
        }
        .profile-container {
          max-width: 600px;
          margin: 0 auto;
        }
        .profile-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 32px;
          box-shadow: var(--shadow-md);
        }
        .profile-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--accent);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 32px;
          margin: 0 auto 16px;
        }
        .profile-email {
          font-size: 18px;
          color: var(--text);
          font-weight: 600;
        }
        .profile-section {
          margin-bottom: 24px;
        }
        .profile-label {
          font-size: 14px;
          color: var(--text2);
          margin-bottom: 8px;
        }
        .profile-value {
          font-size: 16px;
          color: var(--text);
          padding: 12px;
          background: var(--bg2);
          border-radius: 8px;
        }
        .profile-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 32px;
          padding-top: 32px;
          border-top: 1px solid var(--border);
        }
        .profile-btn {
          padding: 12px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        .btn-primary {
          background: var(--accent);
          color: white;
        }
        .btn-primary:hover {
          background: var(--accent2);
        }
        .btn-danger {
          background: var(--bg2);
          color: var(--danger);
          border: 1px solid var(--border);
        }
        .btn-danger:hover {
          background: var(--danger);
          color: white;
        }
      `}</style>

      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="profile-email">{user.email}</div>
            </div>

            <div className="profile-section">
              <div className="profile-label">Account ID</div>
              <div className="profile-value">{user.id}</div>
            </div>

            <div className="profile-section">
              <div className="profile-label">Account Created</div>
              <div className="profile-value">
                {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>

            <div className="profile-actions">
              <button className="profile-btn btn-primary" onClick={() => navigate("dashboard")}>
                Go to Dashboard
              </button>
              <button className="profile-btn btn-danger" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
