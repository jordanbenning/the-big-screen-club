import { useNavigate, useSearchParams } from 'react-router-dom'

function VerifyError() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const message = searchParams.get('message') ?? 'Verification failed'

  const handleSignUp = () => {
    void navigate('/signup')
  }

  return (
    <div
      style={{
        padding: '40px',
        maxWidth: '600px',
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      <h1>❌ Verification Failed</h1>
      <p style={{ marginTop: '20px', fontSize: '1.2rem', color: '#c33' }}>
        {message}
      </p>
      <p style={{ marginTop: '10px', color: '#666' }}>
        The verification link may have expired or is invalid.
      </p>
      <button
        onClick={handleSignUp}
        style={{
          marginTop: '30px',
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
        Try Signing Up Again
      </button>
    </div>
  )
}

export default VerifyError
