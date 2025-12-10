import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import './DriverRequests.css';

function DriverRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        console.log('Sürücü talepleri getiriliyor...');
        const requestsRef = collection(db, 'driverContacts');
        const querySnapshot = await getDocs(requestsRef);
        
        if (querySnapshot.empty) {
          console.log('driverContacts koleksiyonunda hiç veri bulunamadı');
          setRequests([]);
          setLoading(false);
          return;
        }

        console.log('Bulunan talep sayısı:', querySnapshot.size);
        
        const requestList = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          let userData = null;

          // Eğer userId varsa, users koleksiyonundan kullanıcı bilgilerini çek
          if (data.userId) {
            try {
              const userDocRef = doc(db, 'users', data.userId);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                userData = userDocSnap.data();
                console.log('Kullanıcı bilgileri bulundu:', userData);
              }
            } catch (error) {
              console.error('Kullanıcı bilgileri çekilirken hata:', error);
            }
          }

          const requestData = {
            id: docSnapshot.id,
            ...data,
            createdAt: data.createdAt ? data.createdAt.toDate() : null,
            userData: userData
          };
          
          console.log('Talep verisi (detaylı):', JSON.stringify(requestData, null, 2));
          return requestData;
        }));
        
        console.log('İşlenmiş talep listesi (detaylı):', JSON.stringify(requestList, null, 2));
        setRequests(requestList);
      } catch (error) {
        console.error('Talepler yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [db]);

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      const requestRef = doc(db, 'driverContacts', requestId);
      await updateDoc(requestRef, {
        status: newStatus
      });

      setRequests(requests.map(request => 
        request.id === requestId 
          ? { ...request, status: newStatus }
          : request
      ));
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
    }
  };

  return (
    <div className="driver-requests-page">
      <nav className="requests-nav">
        <h2>Sürücü Talepleri</h2>
        <button 
          className="back-button"
          onClick={() => navigate('/admin')}
        >
          Ana Panele Dön
        </button>
      </nav>

      <div className="requests-content">
        {loading ? (
          <div className="loading">Yükleniyor...</div>
        ) : requests.length === 0 ? (
          <div className="no-requests">
            <div className="empty-state">
              <i className="fas fa-check-circle"></i>
              <h3>Aktif Talep Bulunmamaktadır</h3>
              <p>Şu anda sistemde kayıtlı sürücü talebi bulunmamaktadır.</p>
            </div>
          </div>
        ) : (
          <div className="requests-container">
            {requests.map(request => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <div className="user-info">
                    <h3>Başvuran: {request.userData?.name || request.name || 'İsimsiz'}</h3>
                    <span className={`status-badge ${request.status || 'pending'}`}>
                      {request.status === 'pending' ? 'Beklemede' : 
                       request.status === 'investigating' ? 'İnceleniyor' : 
                       request.status === 'resolved' ? (
                         <>
                           <i className="fas fa-check-circle"></i> Çözüldü
                         </>
                       ) : 'Beklemede'}
                    </span>
                  </div>
                  <p className="request-date">
                    {request.createdAt ? request.createdAt.toLocaleDateString('tr-TR') : 'Tarih belirtilmemiş'}
                  </p>
                </div>

                <div className="request-details">
                  <div className="detail-row">
                    <strong>Başvuran:</strong>
                    <span>{request.userData?.name || request.name || 'İsimsiz'}</span>
                  </div>
                  <div className="detail-row">
                    <strong>E-posta:</strong> 
                    <span>{request.userData?.email || request.email || 'Belirtilmemiş'}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Telefon:</strong> 
                    <span>{request.userData?.phoneNumber || request.userData?.phone || request.phone || 'Belirtilmemiş'}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Konu:</strong>
                    <span>{request.subject || 'Konu belirtilmemiş'}</span>
                  </div>
                  <div className="request-description">
                    <strong>Mesaj:</strong>
                    <p>{request.message || 'Mesaj içeriği bulunmamaktadır.'}</p>
                  </div>
                </div>

                {request.status !== 'resolved' && (
                  <div className="request-actions">
                    <button 
                      className={`action-button ${request.status === 'investigating' ? 'active' : ''}`}
                      onClick={() => handleStatusChange(request.id, 'investigating')}
                    >
                      İncelemeye Al
                    </button>
                    <button 
                      className="action-button resolve"
                      onClick={() => handleStatusChange(request.id, 'resolved')}
                    >
                      Çözüldü
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DriverRequests; 