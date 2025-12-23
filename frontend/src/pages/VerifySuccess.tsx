import { useNavigate } from 'react-router-dom';

function VerifySuccess() {
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    void navigate('/');
  };

  return (
    <div
      style={{
        padding: '40px',
        maxWidth: '600px',
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      <h1>✅ Email Verified!</h1>
      <p style={{ marginTop: '20px', fontSize: '1.2rem', color: '#666' }}>
        Your email has been successfully verified. You&apos;re now logged in!
      </p>
      <button
        onClick={handleGoToDashboard}
        style={{
          marginTop: '30px',
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
        Go to Dashboard
      </button>
    </div>
  );
}

export default VerifySuccess;
