import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();

  const handleSignUp = () => {
    void navigate('/signup');
  };

  return (
    <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Log In</h1>
      <p style={{ color: '#666', marginTop: '10px' }}>
        This page is coming soon. For now, you can sign up and verify your
        email.
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
        Sign Up Instead
      </button>
    </div>
  );
}

export default LoginPage;
