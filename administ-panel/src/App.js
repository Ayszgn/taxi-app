import './App.css';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import AdminPanel from './AdminPanel';
import DriverApproval from './DriverApproval';
import AddDriver from './AddDriver';
import DriverList from './DriverList';
import PassengerList from './PassengerList';
import ComplaintManagement from './ComplaintManagement';
import ActiveRides from './ActiveRides';
import RideHistory from './RideHistory';
import RideStatistics from './RideStatistics';
import DriverRequests from './DriverRequests';

// Firebase yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyDQCERqgfEr5cA0yWdw7sYXqQBJHg8Nq7o",
  authDomain: "apptaxi-7b560.firebaseapp.com",
  projectId: "apptaxi-7b560",
  storageBucket: "apptaxi-7b560.firebasestorage.app",
  messagingSenderId: "611230579350",
  appId: "1:611230579350:web:087423f945f09a246a20b7",
  measurementId: "G-QXE5F02924"
};

// Firebase başlatma
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Admin kontrolü için Firestore'dan veri çekme
        const adminSnapshot = await getDocs(collection(db, 'admins'));
        const adminList = adminSnapshot.docs.map(doc => doc.data());
        
        const isAdmin = adminList.some(admin => admin.email === user.email);
        
        if (isAdmin) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          await auth.signOut();
        }
      } else {
        setIsLoggedIn(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Admin kontrolü için Firestore'dan veri çekme
      const adminSnapshot = await getDocs(collection(db, 'admins'));
      const adminList = adminSnapshot.docs.map(doc => doc.data());
      
      const isAdmin = adminList.some(admin => admin.email === user.email);
      
      if (isAdmin) {
        setIsLoggedIn(true);
        setError('');
      } else {
        setError('Bu hesap admin yetkisine sahip değil!');
        await auth.signOut();
      }
    } catch (error) {
      setError('Giriş başarısız: ' + error.message);
    }
  };

  if (isLoggedIn) {
    return (
      <Router>
        <Routes>
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/driver-approvals" element={<DriverApproval />} />
          <Route path="/admin/add-driver" element={<AddDriver />} />
          <Route path="/admin/driver-list" element={<DriverList />} />
          <Route path="/admin/passengers" element={<PassengerList />} />
          <Route path="/admin/complaints" element={<ComplaintManagement />} />
          <Route path="/admin/active-rides" element={<ActiveRides />} />
          <Route path="/admin/ride-history" element={<RideHistory />} />
          <Route path="/admin/ride-statistics" element={<RideStatistics />} />
          <Route path="/admin/driver-requests" element={<DriverRequests />} />
          <Route path="/" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <div className="admin-login">
      <div className="login-container">
        <h1>Taksi Yönetim Paneli</h1>
        {error && <div className="error-message">{error}</div>}
        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>E-posta:</label>
            <input 
              type="email" 
              placeholder="E-posta adresinizi giriniz"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Şifre:</label>
            <input 
              type="password" 
              placeholder="Şifrenizi giriniz"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="login-button">
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
