import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    void (async () => {
      try {
        await logout();
        // Clear remember me preference
        localStorage.removeItem('rememberMe');
        // Redirect to landing page
        void navigate('/');
      } catch (err) {
        console.error('Logout failed:', err);
        // eslint-disable-next-line no-alert
        window.alert('Logout failed. Please try again.');
      }
    })();
  };

  // User data comes from AuthContext, no need for loading or error states
  // ProtectedRoute already handles authentication check

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
        }}
      >
        <h1>Dashboard</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            fontSize: '1rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Log Out
        </button>
      </div>

      {user !== null && (
        <>
          <div
            style={{
              backgroundColor: '#f8f9fa',
              padding: '30px',
              borderRadius: '8px',
              marginBottom: '30px',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Welcome back, {user.username}! 👋</h2>
            <p style={{ color: '#666', fontSize: '1.1rem' }}>
              You&apos;re successfully logged in to The Big Screen Club.
            </p>
          </div>

          <div
            style={{
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Your Profile</h3>
            <div style={{ marginTop: '20px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '150px 1fr',
                  gap: '15px',
                  fontSize: '1rem',
                }}
              >
                <div style={{ fontWeight: 'bold' }}>Username:</div>
                <div>{user.username}</div>

                <div style={{ fontWeight: 'bold' }}>Email:</div>
                <div>{user.email}</div>

                <div style={{ fontWeight: 'bold' }}>Status:</div>
                <div>
                  {user.isVerified ? (
                    <span style={{ color: '#28a745' }}>✓ Verified</span>
                  ) : (
                    <span style={{ color: '#ffc107' }}>⚠ Not Verified</span>
                  )}
                </div>

                <div style={{ fontWeight: 'bold' }}>Member Since:</div>
                <div>
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '30px',
              padding: '20px',
              backgroundColor: '#e7f3ff',
              borderRadius: '8px',
              border: '1px solid #b3d7ff',
            }}
          >
            <h3 style={{ marginTop: 0, color: '#004085' }}>🎬 Coming Soon!</h3>
            <p style={{ color: '#004085', margin: 0 }}>
              Movie clubs, voting, and rating features are on their way. Stay
              tuned!
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
