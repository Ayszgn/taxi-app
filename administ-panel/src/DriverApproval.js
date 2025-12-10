import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import './DriverApproval.css';

function DriverApproval() {
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const db = getFirestore();

  useEffect(() => {
    fetchPendingDrivers();
  }, []);

  const fetchPendingDrivers = async () => {
    try {
      const q = query(
        collection(db, 'drivers'),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      const drivers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPendingDrivers(drivers);
      setLoading(false);
    } catch (error) {
      console.error('Sürücüler yüklenirken hata:', error);
      setLoading(false);
    }
  };

  const handleDriverStatus = async (driverId, status) => {
    try {
      const driverRef = doc(db, 'drivers', driverId);
      await updateDoc(driverRef, {
        status: status,
        updateDate: new Date(),
        reviewedBy: 'admin' // Burada giriş yapan adminin bilgisi eklenebilir
      });

      // Listeyi güncelle
      setPendingDrivers(prevDrivers => 
        prevDrivers.filter(driver => driver.id !== driverId)
      );
    } catch (error) {
      console.error('Sürücü durumu güncellenirken hata:', error);
    }
  };

  return (
    <div className="driver-approval-page">
      <nav className="approval-nav">
        <h2>Onay Bekleyen Sürücüler</h2>
        <div className="nav-buttons">
          <button 
            className="back-button"
            onClick={() => navigate('/admin')}
          >
            Ana Panele Dön
          </button>
        </div>
      </nav>

      <div className="approval-content">
        {loading ? (
          <div className="loading">Yükleniyor...</div>
        ) : pendingDrivers.length === 0 ? (
          <div className="no-drivers">Onay bekleyen sürücü bulunmamaktadır.</div>
        ) : (
          <div className="drivers-grid">
            {pendingDrivers.map(driver => (
              <div key={driver.id} className="driver-card">
                <div className="driver-info">
                  <img 
                    src={driver.profilePhoto || 'default-avatar.png'} 
                    alt="Sürücü Fotoğrafı" 
                    className="driver-photo"
                  />
                  <h3>{driver.name} {driver.surname}</h3>
                  <div className="info-row">
                    <span>Telefon:</span> {driver.phone}
                  </div>
                  <div className="info-row">
                    <span>E-posta:</span> {driver.email}
                  </div>
                  <div className="info-row">
                    <span>Araç Plakası:</span> {driver.licensePlate}
                  </div>
                  <div className="info-row">
                    <span>Başvuru Tarihi:</span> 
                    {new Date(driver.applicationDate?.toDate()).toLocaleDateString('tr-TR')}
                  </div>
                </div>
                
                <div className="document-section">
                  <h4>Belgeler</h4>
                  <div className="document-links">
                    <a href={driver.driverLicense} target="_blank" rel="noopener noreferrer">
                      Sürücü Belgesi
                    </a>
                    <a href={driver.vehicleRegistration} target="_blank" rel="noopener noreferrer">
                      Araç Ruhsatı
                    </a>
                    <a href={driver.criminalRecord} target="_blank" rel="noopener noreferrer">
                      Sabıka Kaydı
                    </a>
                  </div>
                </div>

                <div className="action-buttons">
                  <button 
                    className="approve-button"
                    onClick={() => handleDriverStatus(driver.id, 'approved')}
                  >
                    Onayla
                  </button>
                  <button 
                    className="reject-button"
                    onClick={() => handleDriverStatus(driver.id, 'rejected')}
                  >
                    Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DriverApproval; 