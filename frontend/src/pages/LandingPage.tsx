import { useNavigate } from 'react-router-dom'

function LandingPage() {
  const navigate = useNavigate()

  const handleSignUp = () => {
    void navigate('/signup')
  }

  const handleLogin = () => {
    void navigate('/login')
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <header>
        <h1>🎬 The Big Screen Club</h1>
        <p style={{ fontSize: '1.2rem', marginTop: '20px', color: '#666' }}>
          Create movie clubs, suggest films, vote on what to watch, and share
          your ratings.
        </p>
      </header>

      <main style={{ marginTop: '60px' }}>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <button
            onClick={handleSignUp}
            style={{
              padding: '15px 40px',
              fontSize: '1.1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Sign Up
          </button>
          <button
            onClick={handleLogin}
            style={{
              padding: '15px 40px',
              fontSize: '1.1rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Log In
          </button>
        </div>
      </main>

      <section
        style={{ marginTop: '80px', maxWidth: '800px', margin: '80px auto' }}
      >
        <h2>Features</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginTop: '30px',
          }}
        >
          <div>
            <h3>Create Clubs</h3>
            <p>Start your own movie club with friends</p>
          </div>
          <div>
            <h3>Suggest Movies</h3>
            <p>Propose films for the group to watch</p>
          </div>
          <div>
            <h3>Vote Together</h3>
            <p>Democratically choose what to watch next</p>
          </div>
          <div>
            <h3>Share Ratings</h3>
            <p>Compare ratings and discuss your favorites</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
