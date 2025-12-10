import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import './ActiveRides.css';

function ActiveRides() {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    const fetchActiveRides = async () => {
      try {
        setLoading(true);
        console.log('Aktif yolculuklar getiriliyor...');
        
        const rideRequestsRef = collection(db, 'rideRequests');
        const q = query(
          rideRequestsRef,
          where('status', 'in', ['pending', 'accepted']),
          orderBy('requestTime', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        console.log('Bulunan aktif yolculuk sayısı:', querySnapshot.size);
        
        const ridesList = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            requestTime: data.requestTime?.toDate()
          };
        });
        
        console.log('İşlenmiş aktif yolculuk listesi:', ridesList);
        setRides(ridesList);
      } catch (error) {
        console.error('Aktif yolculuklar yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveRides();
  }, [db]);

  // Konum verilerini formatla
  const formatLocation = (location) => {
    if (!location) return 'Belirtilmemiş';
    if (typeof location === 'string') return location;
    if (location.latitude && location.longitude) {
      return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    }
    return 'Geçersiz konum';
  };

  return (
    <div className="active-rides-page">
      <nav className="active-rides-nav">
        <h2>Aktif Yolculuklar</h2>
        <button 
          className="back-button"
          onClick={() => navigate('/admin')}
        >
          Ana Panele Dön
        </button>
      </nav>

      <div className="active-rides-content">
        {loading ? (
          <div className="loading">Yükleniyor...</div>
        ) : rides.length === 0 ? (
          <div className="no-rides">
            <div className="empty-state">
              <i className="fas fa-car"></i>
              <h3>Aktif Yolculuk Bulunmamaktadır</h3>
              <p>Şu anda devam eden veya bekleyen yolculuk bulunmamaktadır.</p>
            </div>
          </div>
        ) : (
          <div className="rides-table">
            <table>
              <thead>
                <tr>
                  <th>Yolcu</th>
                  <th>Sürücü</th>
                  <th>Başlangıç</th>
                  <th>Varış</th>
                  <th>Talep Zamanı</th>
                  <th>Durum</th>
                  <th>Ücret</th>
                  <th>Detaylar</th>
                </tr>
              </thead>
              <tbody>
                {rides.map(ride => (
                  <tr key={ride.id}>
                    <td>{ride.passengerName || 'Belirtilmemiş'}</td>
                    <td>{ride.driverName || 'Atanmadı'}</td>
                    <td>{formatLocation(ride.pickupLocation)}</td>
                    <td>{formatLocation(ride.dropoffLocation)}</td>
                    <td>{ride.requestTime ? new Date(ride.requestTime).toLocaleString('tr-TR') : 'Belirtilmemiş'}</td>
                    <td>
                      <span className={`status-badge ${ride.status}`}>
                        {ride.status === 'accepted' ? 'Kabul Edildi' : 
                         ride.status === 'pending' ? 'Beklemede' : 'Bilinmiyor'}
                      </span>
                    </td>
                    <td>{ride.estimatedFare || 'Hesaplanıyor'} ₺</td>
                    <td>
                      <button 
                        className="details-button"
                        onClick={() => {
                          console.log('Yolculuk detayları:', ride);
                        }}
                      >
                        Detaylar
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

export default ActiveRides; 