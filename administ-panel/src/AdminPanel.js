import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import './AdminPanel.css';

function AdminPanel() {
  const auth = getAuth();
  const navigate = useNavigate();
  const [driverCount, setDriverCount] = useState(0);
  const [completedRides, setCompletedRides] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Sürücü sayısını getir
        const driverQuery = query(
          collection(db, 'users'),
          where('userType', '==', 'driver')
        );
        const driverSnapshot = await getDocs(driverQuery);
        setDriverCount(driverSnapshot.size);

        // Tamamlanan yolculuk sayısını getir
        const ridesQuery = query(
          collection(db, 'rideRequests'),
          where('status', '==', 'completed')
        );
        const ridesSnapshot = await getDocs(ridesQuery);
        setCompletedRides(ridesSnapshot.size);
      } catch (error) {
        console.error('Veriler alınırken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [db]);

  useEffect(() => {
    const fetchTotalEarnings = async () => {
      try {
        console.log('Toplam kazanç hesaplanıyor...');
        const ridesRef = collection(db, 'rideRequests');
        const q = query(ridesRef, where('status', '==', 'completed'));
        const querySnapshot = await getDocs(q);
        
        console.log('Bulunan tamamlanmış sürüş sayısı:', querySnapshot.size);
        
        let total = 0;
        querySnapshot.forEach((doc) => {
          const ride = doc.data();
          console.log('Sürüş verisi:', ride);
          // fare değerini number'a çevir
          const fare = parseFloat(ride.fare) || 0;
          total += fare;
          console.log('Toplam:', total);
        });

        console.log('Final toplam:', total);
        setTotalEarnings(total);
      } catch (error) {
        console.error('Toplam kazanç hesaplanırken hata:', error);
      }
    };

    fetchTotalEarnings();
  }, [db]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = '/';
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  return (
    <div className="admin-panel">
      <nav className="admin-nav">
        <h2>Sür&Öde Taksi Yönetim Paneli</h2>
        <button onClick={handleLogout} className="logout-button">Çıkış Yap</button>
      </nav>
      
      <div className="admin-content">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Aktif Sürücüler</h3>
            <p className="number">{loading ? '...' : driverCount}</p>
          </div>
          <div className="dashboard-card">
            <h3>Tamamlanan Yolculuklar</h3>
            <p className="number">{loading ? '...' : completedRides}</p>
          </div>
          <div className="dashboard-card">
            <h3>Toplam Kazanç</h3>
            <p className="number">
              {loading ? '...' : totalEarnings.toLocaleString('tr-TR', {
                style: 'currency',
                currency: 'TRY'
              })}
            </p>
          </div>
        </div>

        <div className="management-sections">
          <section className="management-section">
            <h3>Sürücü Yönetimi</h3>
            <div className="button-container">
              <button 
                className="management-button"
                onClick={() => navigate('/admin/add-driver')}
              >
                Sürücü Ekle
              </button>
              <button 
                className="management-button"
                onClick={() => navigate('/admin/driver-list')}
              >
                Sürücüleri Listele
              </button>
              <button 
                className="management-button warning"
                onClick={() => navigate('/admin/driver-requests')}
              >
                Sürücü Talep/Şikayet
              </button>
            </div>
          </section>

          <section className="management-section">
            <h3>Yolcu Yönetimi</h3>
            <div className="button-container">
              <button 
                className="management-button"
                onClick={() => navigate('/admin/passengers')}
              >
                Yolcu Görüntüleme
              </button>
              <button 
                className="management-button danger"
                onClick={() => navigate('/admin/complaints')}
              >
                Yolcu Talep/Şikayet
              </button>
            </div>
          </section>

          <section className="management-section">
            <h3>Yolculuk Yönetimi</h3>
            <div className="button-container">
              <button 
                className="management-button"
                onClick={() => navigate('/admin/ride-statistics')}
              >
                Yolculuk İstatistikleri
              </button>
              <button 
                className="management-button"
                onClick={() => navigate('/admin/ride-history')}
              >
                Yolculuk Geçmişi
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel; 