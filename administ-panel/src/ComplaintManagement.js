import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import './ComplaintManagement.css';

function ComplaintManagement() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        console.log('Şikayetler getiriliyor...');
        const contactsRef = collection(db, 'contacts');
        const querySnapshot = await getDocs(contactsRef);
        
        if (querySnapshot.empty) {
          console.log('contacts koleksiyonunda hiç veri bulunamadı');
          setComplaints([]);
          setLoading(false);
          return;
        }

        console.log('Bulunan şikayet sayısı:', querySnapshot.size);
        
        const complaintList = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
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

          const complaintData = {
            id: docSnapshot.id,
            ...data,
            createdAt: data.createdAt ? data.createdAt.toDate() : null,
            userData: userData
          };
          
          console.log('Şikayet verisi (detaylı):', JSON.stringify(complaintData, null, 2));
          return complaintData;
        }));
        
        console.log('İşlenmiş şikayet listesi (detaylı):', JSON.stringify(complaintList, null, 2));
        setComplaints(complaintList);
      } catch (error) {
        console.error('Şikayetler yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [db]);

  const handleStatusUpdate = async (complaintId, newStatus) => {
    try {
      await updateDoc(doc(db, 'contacts', complaintId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Listeyi güncelle
      setComplaints(complaints.map(complaint => 
        complaint.id === complaintId 
          ? {...complaint, status: newStatus} 
          : complaint
      ));
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
    }
  };

  return (
    <div className="complaint-management-page">
      <nav className="complaint-nav">
        <h2>Şikayet Yönetimi</h2>
        <button 
          className="back-button"
          onClick={() => navigate('/admin')}
        >
          Ana Panele Dön
        </button>
      </nav>

      <div className="complaint-content">
        {loading ? (
          <div className="loading">Yükleniyor...</div>
        ) : complaints.length === 0 ? (
          <div className="no-complaints">
            <div className="empty-state">
              <i className="fas fa-check-circle"></i>
              <h3>Aktif Şikayet Bulunmamaktadır</h3>
              <p>Şu anda sistemde kayıtlı şikayet bulunmamaktadır.</p>
            </div>
          </div>
        ) : (
          <div className="complaints-container">
            {complaints.map(complaint => (
              <div key={complaint.id} className="complaint-card">
                <div className="complaint-header">
                  <div className="user-info">
                    <h3>Gönderen: {complaint.userData?.name || complaint.name || 'İsimsiz'}</h3>
                    <span className={`status-badge ${complaint.status || 'pending'}`}>
                      {complaint.status === 'pending' ? 'Beklemede' : 
                       complaint.status === 'investigating' ? 'İnceleniyor' : 
                       complaint.status === 'resolved' ? (
                         <>
                           <i className="fas fa-check-circle"></i> Çözüldü
                         </>
                       ) : 'Beklemede'}
                    </span>
                  </div>
                  <p className="complaint-date">
                    {complaint.createdAt ? complaint.createdAt.toLocaleDateString('tr-TR') : 'Tarih belirtilmemiş'}
                  </p>
                </div>

                <div className="complaint-details">
                  <div className="detail-row">
                    <strong>Gönderen:</strong>
                    <span>{complaint.userData?.name || complaint.name || 'İsimsiz'}</span>
                  </div>
                  <div className="detail-row">
                    <strong>E-posta:</strong> 
                    <span>{complaint.userData?.email || complaint.email || 'Belirtilmemiş'}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Telefon:</strong> 
                    <span>{complaint.userData?.phoneNumber || complaint.userData?.phone || complaint.phone || 'Belirtilmemiş'}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Konu:</strong>
                    <span>{complaint.subject || 'Konu belirtilmemiş'}</span>
                  </div>
                  <div className="complaint-description">
                    <strong>Mesaj:</strong>
                    <p>{complaint.message || 'Mesaj içeriği bulunmamaktadır.'}</p>
                  </div>
                </div>

                <div className="complaint-actions">
                  {complaint.status !== 'resolved' && (
                    <>
                      <button 
                        className="action-button investigating"
                        onClick={() => handleStatusUpdate(complaint.id, 'investigating')}
                        disabled={complaint.status === 'investigating'}
                      >
                        İncelemeye Al
                      </button>
                      <button 
                        className="action-button resolved"
                        onClick={() => handleStatusUpdate(complaint.id, 'resolved')}
                        disabled={complaint.status === 'resolved'}
                      >
                        Çözüldü
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ComplaintManagement; 