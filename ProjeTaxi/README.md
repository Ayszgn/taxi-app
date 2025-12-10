

# 🚕 TaxiApp – Sürücü ve Yolcu Uygulaması

Bu proje, eğitim döneminde geliştirilmiş olan, **sürücü ve yolcu için iki ayrı panel** içeren temel bir taksi çağırma uygulamasıdır. Uygulama, **React Native** ile geliştirilmiş ve **Firebase** altyapısı ile desteklenmiştir.

Uygulama, sürücü ve yolcu etkileşimlerini simülasyon üzerinden gösterir; gerçek GPS konum verisi kullanılmaz.

---

## 📌 Özellikler

### 👤 Yolcu Uygulaması

* Kullanıcı girişi ve kayıt sistemi
* Pickup ve dropoff adresi seçimi
* Sürücü seçme ve bildirim gönderme
* Seçilen sürücüyü canlı simülasyon üzerinden takip etme
* Sürücü yolcuyu aldığında durum güncellemesi

### 🚗 Sürücü Uygulaması

* Sürücü kayıt ekranı
* Araç bilgileri ekleme (marka, plaka, sigorta vb.)
* Görev kabul etme
* Yolcu konumunu görüntüleme (simülasyon)
* Yolculuk başlatma / tamamlama bildirimi

---

## 🏗 Kullanılan Teknolojiler

### **Frontend**

* React Native
* React Navigation
* Google Maps / Directions API (rota ve simülasyon için)
* Expo / react-native-maps (simülasyon için konum ve harita gösterimi)

### **Backend / Database**

* Firebase Authentication (kullanıcı yönetimi)
* Firebase Firestore (yolculuk verilerini okuma ve güncelleme)
* Firebase Realtime Database (opsiyonel: gerçek zamanlı konum takibi için kullanılabilir)

---

## 📡 API ve İstekler

| Sistem                    | İşlev                                          | Kod içinde nerede?                                |
| ------------------------- | ---------------------------------------------- | ------------------------------------------------- |
| **Google Directions API** | Pickup → Dropoff arasındaki rota bilgisi almak | `startSimulation()` ve `updateRouteCoordinates()` |
| **Firebase Firestore**    | Yolculuk verilerini okuma ve güncelleme        | `onSnapshot` ve `updateDoc`                       |

> Not: Bu proje **gerçek GPS kullanmaz**, sürücü konumu ve rota **simülasyon** ile gösterilir.

---

## 📁 Proje Yapısı

Proje iki ayrı uygulama klasörü içerir:

```txt
TaxiApp/
│
├── driver/        → Sürücü arayüzü
└── passenger/     → Yolcu arayüzü
```

Her klasör, kendi bağımsız **React Native uygulamasını** çalıştırır.

---

## ▶️ Çalıştırma

### 1) Projeyi klonlayın

```bash
git clone https://github.com/Ayszgn/taxi-app.git
```

### 2) Driver uygulamasını çalıştırın

```bash
cd driver
npm install
npm start
```

### 3) Passenger uygulamasını çalıştırın

```bash
cd passenger
npm install
npm start
```

---

## 🔐 Firebase Yapılandırması

Her iki uygulamada da `firebase.js` dosyasında **Firestore ve Auth ayarları** bulunur.
Dosya adları veya yapı farklı ise güncelleme yapılması gerekebilir.

---

## ⚠️ Önemli Notlar

* Bu proje eğitim döneminde geliştirilmiştir; bazı kod bölümleri temizlenmeye ve optimize edilmeye ihtiyaç duyabilir.
* Sürücü ve yolcu konumları **simülasyon** üzerinden güncellenir; gerçek cihaz GPS verisi kullanılmaz.
* Rota bilgileri **Google Directions API** ile alınır ve Firebase Firestore üzerinden yolculuk durumu güncellenir.

---

## 📜 Lisans

Bu proje tamamen **öğrenme ve gösterim amaçlıdır**.

---

## 📌 Önerilen Geliştirmeler

* Gerçek konum takibi eklemek için `expo-location` veya `navigator.geolocation` kullanılabilir.
* Görevler ve rota güncellemeleri için **push notification** desteği eklenebilir.
* UI/UX geliştirmeleri ile uygulama daha kullanıcı dostu hale getirilebilir.

