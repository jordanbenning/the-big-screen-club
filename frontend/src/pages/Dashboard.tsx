import ClubList from '../components/ClubList'
import { useAuth } from '../contexts/AuthContext'

function Dashboard() {
  const { user } = useAuth()

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '40px' }}>Dashboard</h1>

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

          {/* Movie Clubs Section */}
          <div
            style={{
              marginBottom: '30px',
            }}
          >
            <ClubList />
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard
