import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './AddDriver.css';

function AddDriver() {
  const navigate = useNavigate();
  const db = getFirestore();
  const storage = getStorage();

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    licensePlate: '',
    identityNumber: '',
    birthDate: '',
    address: ''
  });

  const [documents, setDocuments] = useState({
    driverLicense: null,
    vehicleRegistration: null,
    criminalRecord: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setDocuments(prev => ({
      ...prev,
      [name]: files[0]
    }));
  };

  const uploadFile = async (file, path) => {
    if (!file) return null;
    const fileRef = ref(storage, `drivers/${path}/${Date.now()}-${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Dosyaları yükle
      const uploadedFiles = await Promise.all([
        uploadFile(documents.driverLicense, 'licenses'),
        uploadFile(documents.vehicleRegistration, 'registrations'),
        uploadFile(documents.criminalRecord, 'records')
      ]);

      // Firestore'a sürücü bilgilerini ekle
      await addDoc(collection(db, 'drivers'), {
        ...formData,
        driverLicense: uploadedFiles[0],
        vehicleRegistration: uploadedFiles[1],
        criminalRecord: uploadedFiles[2],
        status: 'pending',
        applicationDate: new Date(),
        createdAt: new Date()
      });

      alert('Sürücü başvurusu başarıyla oluşturuldu!');
      navigate('/admin');
    } catch (error) {
      setError('Sürücü eklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-driver-page">
      <nav className="add-driver-nav">
        <h2>Yeni Sürücü Ekle</h2>
        <button 
          className="back-button"
          onClick={() => navigate('/admin')}
        >
          Ana Panele Dön
        </button>
      </nav>

      <div className="add-driver-content">
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="driver-form">
          <div className="form-section">
            <h3>Kişisel Bilgiler</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Ad*</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Soyad*</label>
                <input
                  type="text"
                  name="surname"
                  value={formData.surname}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>E-posta*</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Telefon*</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>TC Kimlik No*</label>
                <input
                  type="text"
                  name="identityNumber"
                  value={formData.identityNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Doğum Tarihi*</label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Adres*</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Araç Plakası*</label>
                <input
                  type="text"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Belgeler</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Sürücü Belgesi*</label>
                <input
                  type="file"
                  name="driverLicense"
                  onChange={handleFileChange}
                  accept=".pdf,image/*"
                  required
                />
              </div>

              <div className="form-group">
                <label>Araç Ruhsatı*</label>
                <input
                  type="file"
                  name="vehicleRegistration"
                  onChange={handleFileChange}
                  accept=".pdf,image/*"
                  required
                />
              </div>

              <div className="form-group">
                <label>Sabıka Kaydı*</label>
                <input
                  type="file"
                  name="criminalRecord"
                  onChange={handleFileChange}
                  accept=".pdf,image/*"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-button" 
              disabled={loading}
            >
              {loading ? 'Kaydediliyor...' : 'Sürücü Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddDriver; 