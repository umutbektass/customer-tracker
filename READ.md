# Müşteri Takip Sistemi - Backend API

Bu proje, müşterilerin ve onlarla ilgili finansal işlemlerin (gelen/giden para) takibini sağlayan bir backend API sistemidir. Sistem, JWT tabanlı kimlik doğrulama ve İki Adımlı Doğrulama (E-posta & Google Authenticator) özelliklerini içerir.

## ✨ Öne Çıkan Özellikler

* **Yönetici Girişi:** Güvenli kullanıcı adı/şifre ile giriş.
* **İki Adımlı Doğrulama (2FA):**
    * Google Authenticator (TOTP) desteği.
    * E-posta ile kod gönderimi desteği.
    * Kullanıcı tercihine göre metot seçimi ve yönetimi.
* **Müşteri Yönetimi (CRUD):**
    * Yeni müşteri ekleme.
    * Tüm müşterileri listeleme.
    * Belirli bir müşteriyi ID ile getirme.
    * Müşteri bilgilerini güncelleme.
    * Müşteri silme.
* **Finansal İşlem Takibi:**
    * Müşteriye bağlı "Gelen Para" veya "Giden Para" işlemi ekleme.
    * Tüm işlemleri listeleme (müşteri bilgileriyle birlikte).
    * Belirli bir müşteriye ait işlemleri listeleme.
* **Raporlama:**
    * Tarih aralığına göre toplam Gelen/Giden Para ve Net Kâr özeti.
    * Belirtilen tarih aralığında en çok işlem yapan müşteriler listesi.
* **Güvenlik:** JWT ile oturum yönetimi, şifre hashleme (bcryptjs), korumalı endpoint'ler.
* **API:** RESTful API prensiplerine uygun endpoint yapıları.
* **Hata Yönetimi:** Merkezi ve tutarlı JSON formatında hata yanıtları.

## 🛠️ Kullanılan Teknolojiler

* **Backend:** Node.js, Express.js
* **Veritabanı:** MongoDB (Mongoose ODM ile)
* **Kimlik Doğrulama:** JSON Web Token (JWT), bcryptjs
* **2FA:** Speakeasy (Authenticator), Nodemailer (E-posta)
* **Diğer:** dotenv, cors

## 🚀 Kurulum ve Başlatma

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin:

1.  **Depoyu Klonlayın:**
    ```bash
    git clone <repository_url>
    cd customer-tracker/backend
    ```
2.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    # veya
    # yarn install
    ```
3.  **Ortam Değişkenlerini Ayarlayın:**
    * `backend` klasöründe `.env.example` adında bir dosya varsa, onu kopyalayarak `.env` adında yeni bir dosya oluşturun.
    * Eğer `.env.example` yoksa, manuel olarak `backend` klasöründe `.env` adında bir dosya oluşturun.
    * Aşağıda "Ortam Değişkenleri" başlığında listelenen tüm değişkenleri kendi ayarlarınıza göre bu `.env` dosyasına ekleyin. (Özellikle `MONGODB_URI`, `JWT_SECRET` ve E-posta ayarları önemlidir).
4.  **MongoDB Bağlantısı:** MongoDB sunucunuzun çalıştığından ve `MONGODB_URI` değişkeninin doğru olduğundan emin olun.
5.  **İlk Admin Kullanıcısını Oluşturma (Manuel):**
    * MongoDB veritabanınıza bağlanın (örn: MongoDB Compass ile).
    * `users` koleksiyonuna gidin.
    * İlk admin kullanıcısı için bir kayıt ekleyin. `password` alanını hash'lenmiş olarak eklemeyi unutmayın. (Detaylar API dökümantasyonunda belirtilmiştir).
6.  **Sunucuyu Başlatın:**
    * Geliştirme ortamı için (nodemon ile otomatik yeniden başlatma):
        ```bash
        npm run server
        ```
    * Üretim ortamı için:
        ```bash
        npm start
        ```
7.  Sunucu varsayılan olarak `http://localhost:5000` (veya `.env` dosyasında belirttiğiniz `PORT`) adresinde çalışmaya başlayacaktır.

## ⚙️ Ortam Değişkenleri (`backend/.env`)

Projenin çalışması için `backend` klasöründe aşağıdaki değişkenleri içeren bir `.env` dosyası oluşturulmalıdır:

```dotenv
# Sunucu Ayarları
PORT=5000                       # Backend sunucusunun çalışacağı port
NODE_ENV=development            # Ortam tipi ('development' veya 'production')

# Veritabanı Ayarları
MONGODB_URI=mongodb://localhost:27017/musteri_takip # MongoDB bağlantı adresi

# JWT Ayarları
JWT_SECRET=BURAYA_COK_GUVENLI_RASTGELE_BIR_ANAHTAR_GIRIN # JWT imzalamak için gizli anahtar
JWT_EXPIRES_IN=1h               # Ana JWT token geçerlilik süresi (örn: 1h, 7d)

# E-posta Gönderimi (Nodemailer) Ayarları
EMAIL_HOST=smtp_sunucu_adresiniz # Örn: mail.ubektas.xyz, smtp.gmail.com
EMAIL_PORT=587                  # SMTP portu (örn: 587, 465, 2525)
EMAIL_USER=eposta_kullanici_adiniz # Örn: noreply@ubektas.xyz
EMAIL_PASS=eposta_sifreniz      # E-posta hesabının şifresi
EMAIL_FROM="Uygulama Adı <noreply@ubektas.xyz>" # E-postanın 'From' kısmında görünecek ad ve adres