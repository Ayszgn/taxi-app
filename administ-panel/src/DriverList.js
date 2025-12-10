import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import './DriverList.css';

function DriverList() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        console.log('Sürücüler getiriliyor...');
        const q = query(
          collection(db, 'users'),
          where('userType', '==', 'driver')
        );
        
        const querySnapshot = await getDocs(q);
        console.log('Bulunan sürücü sayısı:', querySnapshot.size);
        
        const driversList = querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Sürücü verisi:', {
            id: doc.id,
            ...data
          });
          return {
            id: doc.id,
            ...data
          };
        });
        
        console.log('İşlenmiş sürücü listesi:', driversList);
        setDrivers(driversList);
      } catch (error) {
        console.error('Sürücüler yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, [db]);

  // Sürücü silme fonksiyonu
  const handleDeleteDriver = async (driverId, driverName) => {
    if (window.confirm(`${driverName} isimli sürücüyü silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteDoc(doc(db, 'users', driverId));
        setDrivers(drivers.filter(driver => driver.id !== driverId));
        alert('Sürücü başarıyla silindi.');
      } catch (error) {
        console.error('Sürücü silinirken hata:', error);
        alert('Sürücü silinirken bir hata oluştu.');
      }
    }
  };

  return (
    <div className="driver-list-page">
      <nav className="driver-list-nav">
        <div className="driver-list-header">
          <h2>Sürücü Listesi</h2>
          <span className="driver-count">{drivers.length} Sürücü</span>
        </div>
        <div className="nav-buttons">
          <button 
            className="add-driver-button"
            onClick={() => navigate('/admin/add-driver')}
          >
            Yeni Sürücü Ekle
          </button>
          <button 
            className="back-button"
            onClick={() => navigate('/admin')}
          >
            Ana Panele Dön
          </button>
        </div>
      </nav>

      <div className="driver-list-content">
        {loading ? (
          <div className="loading">Yükleniyor...</div>
        ) : drivers.length === 0 ? (
          <div className="no-drivers">
            <div className="empty-state">
              <i className="fas fa-users-slash"></i>
              <h3>Henüz Kayıtlı Sürücü Bulunmamaktadır</h3>
              <p>Yeni sürücü eklemek için "Yeni Sürücü Ekle" butonunu kullanabilirsiniz.</p>
              <button 
                className="add-driver-button"
                onClick={() => navigate('/admin/add-driver')}
              >
                Yeni Sürücü Ekle
              </button>
            </div>
          </div>
        ) : (
          <div className="drivers-table">
            <table>
              <thead>
                <tr>
                  <th>Ad Soyad</th>
                  <th>E-posta</th>
                  <th>Telefon</th>
                  <th>Plaka</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(driver => (
                  <tr key={driver.id}>
                    <td>{driver.fullName}</td>
                    <td>{driver.email}</td>
                    <td>{driver.phoneNumber}</td>
                    <td>{driver.licensePlate || '-'}</td>
                    <td>
                      <span className={`status-badge ${driver.isOnline ? 'active' : 'inactive'}`}>
                        {driver.isOnline ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteDriver(driver.id, driver.fullName)}
                      >
                        Sürücüyü Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DriverList; 