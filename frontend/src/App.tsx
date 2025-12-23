import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import VerifyError from './pages/VerifyError';
import VerifySuccess from './pages/VerifySuccess';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-success" element={<VerifySuccess />} />
        <Route path="/verify-error" element={<VerifyError />} />
      </Routes>
    </Router>
  );
}

export default App;
