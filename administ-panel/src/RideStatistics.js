import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import './RideStatistics.css';

function RideStatistics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    daily: {
      rides: 0,
      earnings: 0
    },
    weekly: {
      rides: 0,
      earnings: 0
    },
    monthly: {
      rides: 0,
      earnings: 0
    },
    total: {
      rides: 0,
      earnings: 0
    }
  });
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [reportType, setReportType] = useState('excel');
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        console.log('İstatistikler getiriliyor...');
        
        const ridesRef = collection(db, 'rideRequests');
        const querySnapshot = await getDocs(ridesRef);
        
        console.log('Toplam yolculuk sayısı:', querySnapshot.size);
        
        // Tüm yolculukları al
        const allRides = querySnapshot.docs.map(doc => doc.data());
        console.log('Tüm yolculuklar:', allRides);
        
        // Tamamlanmış yolculukları filtrele
        const completedRides = allRides.filter(ride => ride.status === 'completed');
        console.log('Tamamlanmış yolculuklar:', completedRides);
        
        // Toplam yolculuk sayısı
        const totalRides = completedRides.length;
        
        // Toplam kazanç
        const totalEarnings = completedRides.reduce((sum, ride) => {
          const fare = parseFloat(ride.fare) || 0;
          console.log('Yolculuk ücreti:', fare);
          return sum + fare;
        }, 0);
        
        console.log('İstatistikler:', {
          totalRides,
          totalEarnings
        });

        setStats({
          daily: { rides: totalRides, earnings: totalEarnings },
          weekly: { rides: totalRides, earnings: totalEarnings },
          monthly: { rides: totalRides, earnings: totalEarnings },
          total: { rides: totalRides, earnings: totalEarnings }
        });

      } catch (error) {
        console.error('İstatistikler yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [db]);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
  };

  const generateReport = () => {
    // Burada rapor oluşturma işlemleri yapılacak
    console.log('Rapor oluşturuluyor:', {
      dateRange,
      reportType
    });
  };

  return (
    <div className="ride-statistics-page">
      <nav className="statistics-nav">
        <h2>Yolculuk İstatistikleri</h2>
        <button 
          className="back-button"
          onClick={() => navigate('/admin')}
        >
          Ana Panele Dön
        </button>
      </nav>

      <div className="statistics-content">
        {loading ? (
          <div className="loading">Yükleniyor...</div>
        ) : (
          <>
            <div className="statistics-grid">
              <div className="stat-card">
                <h3>Günlük İstatistikler</h3>
                <div className="stat-details">
                  <p>Yolculuk Sayısı: {stats.daily.rides}</p>
                  <p>Toplam Kazanç: {stats.daily.earnings.toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY'
                  })}</p>
                </div>
              </div>

              <div className="stat-card">
                <h3>Haftalık İstatistikler</h3>
                <div className="stat-details">
                  <p>Yolculuk Sayısı: {stats.weekly.rides}</p>
                  <p>Toplam Kazanç: {stats.weekly.earnings.toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY'
                  })}</p>
                </div>
              </div>

              <div className="stat-card">
                <h3>Aylık İstatistikler</h3>
                <div className="stat-details">
                  <p>Yolculuk Sayısı: {stats.monthly.rides}</p>
                  <p>Toplam Kazanç: {stats.monthly.earnings.toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY'
                  })}</p>
                </div>
              </div>

              <div className="stat-card">
                <h3>Toplam İstatistikler</h3>
                <div className="stat-details">
                  <p>Yolculuk Sayısı: {stats.total.rides}</p>
                  <p>Toplam Kazanç: {stats.total.earnings.toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY'
                  })}</p>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h3>Yolculuk Raporu Oluştur</h3>
              <div className="report-form">
                <div className="form-group">
                  <label>Başlangıç Tarihi</label>
                  <input
                    type="date"
                    name="startDate"
                    value={dateRange.startDate}
                    onChange={handleDateChange}
                  />
                </div>

                <div className="form-group">
                  <label>Bitiş Tarihi</label>
                  <input
                    type="date"
                    name="endDate"
                    value={dateRange.endDate}
                    onChange={handleDateChange}
                  />
                </div>

                <div className="form-group">
                  <label>Rapor Formatı</label>
                  <select value={reportType} onChange={handleReportTypeChange}>
                    <option value="excel">Excel</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>

                <button 
                  className="generate-button"
                  onClick={generateReport}
                  disabled={!dateRange.startDate || !dateRange.endDate}
                >
                  Rapor Oluştur
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RideStatistics; 