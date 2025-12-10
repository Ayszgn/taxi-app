import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import './RideHistory.css';

function RideHistory() {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  // Koordinatları adrese dönüştür
  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyAJ6lFjjbSzTVi9FA31ZaSk0YkA981fPu4`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return 'Adres bulunamadı';
    } catch (error) {
      console.error('Geocoding hatası:', error);
      return 'Adres dönüştürme hatası';
    }
  };

  // Konum verilerini formatla
  const formatLocation = async (location) => {
    if (!location) return 'Belirtilmemiş';
    if (typeof location === 'string') return location;
    if (location.latitude && location.longitude) {
      const address = await reverseGeocode(location.latitude, location.longitude);
      return address;
    }
    return 'Geçersiz konum';
  };

  useEffect(() => {
    const fetchRides = async () => {
      try {
        setLoading(true);
        const ridesRef = collection(db, 'rideRequests');
        const q = query(ridesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        // Ham verileri kontrol et
        console.log('Ham veriler:', querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
        
        // Önce tüm yolculukları al
        const ridesList = querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('İşlenen yolculuk verisi:', data);
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            endLocation: data.dropoffLocation?.display_name || data.dropoffLocation?.name || 'Belirtilmemiş'
          };
        });

        // Sonra her yolculuk için başlangıç konumlarını dönüştür
        const ridesWithAddresses = await Promise.all(
          ridesList.map(async (ride) => {
            const startAddress = await formatLocation(ride.startLocation);
            return {
              ...ride,
              startLocation: startAddress
            };
          })
        );
        
        console.log('İşlenmiş yolculuk listesi:', ridesWithAddresses);
        setRides(ridesWithAddresses);
      } catch (error) {
        console.error('Yolculuklar yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, [db]);

  return (
    <div className="ride-history-page">
      <nav className="ride-history-nav">
        <h2>Yolculuk Geçmişi</h2>
        <button 
          className="back-button"
          onClick={() => navigate('/admin')}
        >
          Ana Panele Dön
        </button>
      </nav>

      <div className="ride-history-content">
        {loading ? (
          <div className="loading">Yükleniyor...</div>
        ) : rides.length === 0 ? (
          <div className="no-rides">
            <div className="empty-state">
              <i className="fas fa-history"></i>
              <h3>Yolculuk Geçmişi Bulunmamaktadır</h3>
              <p>Henüz yolculuk kaydı bulunmamaktadır.</p>
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
                  <th>Oluşturulma Zamanı</th>
                  <th>Durum</th>
                  <th>Ücret</th>
                </tr>
              </thead>
              <tbody>
                {rides.map(ride => (
                  <tr key={ride.id}>
                    <td>{ride.passengerName || 'İsimsiz'}</td>
                    <td>{ride.driverName || 'İsimsiz'}</td>
                    <td>{ride.startLocation || 'Yükleniyor...'}</td>
                    <td>{ride.endLocation || 'Yükleniyor...'}</td>
                    <td>{ride.createdAt ? ride.createdAt.toLocaleDateString('tr-TR') : 'Belirtilmemiş'}</td>
                    <td>
                      <span className={`status-badge ${ride.status || 'pending'}`}>
                        {ride.status === 'pending' ? 'Beklemede' : 
                         ride.status === 'accepted' ? 'Kabul Edildi' : 
                         ride.status === 'in_progress' ? 'Devam Ediyor' : 
                         ride.status === 'completed' ? 'Tamamlandı' : 
                         ride.status === 'cancelled' ? 'İptal Edildi' : 'Beklemede'}
                      </span>
                    </td>
                    <td>
                      <span className="fare">
                        {ride.fare ? ride.fare.toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY'
                        }) : 'Belirtilmemiş'}
                      </span>
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

export default RideHistory; 