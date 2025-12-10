import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import './PassengerList.css';

function PassengerList() {
  const navigate = useNavigate();
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    const fetchPassengers = async () => {
      try {
        console.log('Yolcular getiriliyor...');
        const q = query(
          collection(db, 'users'),
          where('userType', '==', 'passenger')
        );
        const querySnapshot = await getDocs(q);
        console.log('Bulunan döküman sayısı:', querySnapshot.size);
        
        const passengerList = querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Yolcu verisi:', data);
          return {
            id: doc.id,
            ...data
          };
        });
        
        console.log('İşlenmiş yolcu listesi:', passengerList);
        setPassengers(passengerList);
      } catch (error) {
        console.error('Yolcular yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPassengers();
  }, []);

  return (
    <div className="passenger-list-page">
      <nav className="passenger-list-nav">
        <h2>Yolcu Listesi</h2>
        <button 
          className="back-button"
          onClick={() => navigate('/admin')}
        >
          Ana Panele Dön
        </button>
      </nav>

      <div className="passenger-list-content">
        {loading ? (
          <div className="loading">Yükleniyor...</div>
        ) : passengers.length === 0 ? (
          <div className="no-passengers">
            <div className="empty-state">
              <i className="fas fa-users"></i>
              <h3>Henüz Kayıtlı Yolcu Bulunmamaktadır</h3>
              <p>Yolcular uygulamaya kayıt oldukça burada listelenecektir.</p>
            </div>
          </div>
        ) : (
          <div className="passengers-table">
            <table>
              <thead>
                <tr>
                  <th>Ad Soyad</th>
                  <th>Telefon</th>
                  <th>E-posta</th>
                  <th>Kayıt Tarihi</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {passengers.map(passenger => (
                  <tr key={passenger.id}>
                    <td>{passenger.name} {passenger.surname}</td>
                    <td>{passenger.phone}</td>
                    <td>{passenger.email}</td>
                    <td>{new Date(passenger.createdAt?.toDate()).toLocaleDateString('tr-TR')}</td>
                    <td>
                      <span className={`status-badge ${passenger.status || 'active'}`}>
                        {passenger.status === 'active' ? 'Aktif' : 
                         passenger.status === 'inactive' ? 'Pasif' : 'Aktif'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="edit-button"
                        onClick={() => navigate(`/admin/edit-passenger/${passenger.id}`)}
                      >
                        Düzenle
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

export default PassengerList; 