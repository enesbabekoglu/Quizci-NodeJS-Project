import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateQuiz from './pages/CreateQuiz';
import QuizDetail from './pages/QuizDetail';
import LiveSession from './pages/LiveSession';
import AdminPanel from './pages/AdminPanel';
import Debug from './pages/Debug';
import JoinSession from './pages/JoinSession';
import SessionStart from './pages/SessionStart';
import './App.css';

// Tüm sayfa bileşenleri dosyalardan import edildi

// Koruma bileşeni - sadece giriş yapmış kullanıcılar için
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) return <div>Yükleniyor...</div>;
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            {/* Genel erişime açık rotalar */}
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/join/:pin?" element={<JoinSession />} />
            
            {/* Koruma gerektiren rotalar */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/create" element={
              <ProtectedRoute>
                <CreateQuiz />
              </ProtectedRoute>
            } />
            <Route path="/quiz/:quizId" element={
              <ProtectedRoute>
                <QuizDetail />
              </ProtectedRoute>
            } />
            <Route path="/session/start/:quizId" element={
              <ProtectedRoute>
                <SessionStart />
              </ProtectedRoute>
            } />
            {/* Live Session sayfası hem üyeler hem misafirler için erişilebilir */}
            <Route path="/session/:sessionId" element={<LiveSession />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/debug" element={
              <ProtectedRoute>
                <Debug />
              </ProtectedRoute>
            } />
            
            {/* Bulunamayan sayfalar için */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
