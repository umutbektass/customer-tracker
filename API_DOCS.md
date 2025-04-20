---

## API Dökümantasyonu Detayları (README.md'ye eklenebilir veya ayrı bir dosyada tutulabilir)

### Genel Bilgiler

* **Base URL:** `/api`
* **Kimlik Doğrulama:** `Private` olarak işaretlenen endpoint'ler, `Authorization: Bearer <JWT_TOKEN>` header'ını gerektirir. Token, başarılı `/login` veya `/verify-login-2fa` işlemlerinden sonra alınır.
* **Hata Yanıtları:** Hatalar genellikle aşağıdaki JSON formatında döndürülür (HTTP status kodları ile birlikte):
    ```json
    {
        "success": false,
        "message": "Hata açıklaması burada yer alır.",
        // "stack": "..." // Sadece NODE_ENV=development ise görünür
    }
    ```

---

### 1. Authentication (`/api/auth`)

* **`POST /login`**
    * **Açıklama:** Kullanıcı girişi yapar.
    * **Access:** Public
    * **Request Body:**
        ```json
        {
            "username": "admin_kullanici_adi",
            "password": "admin_sifresi"
        }
        ```
    * **Success Response (2FA Kapalı):** (Status 200 OK)
        ```json
        {
            "success": true,
            "message": "Giriş başarılı.",
            "requires2FA": false,
            "token": "MAIN_JWT_TOKEN",
            "user": { "_id", "username", "email", "isAdmin", "twoFactorEnabled" }
        }
        ```
    * **Success Response (2FA Email Gerekli):** (Status 200 OK)
        ```json
        {
            "success": true,
            "message": "... e-postanıza gönderilen kodu girin.",
            "requires2FA": true,
            "method": "email",
            "userId": "USER_ID",
            "username": "...",
            "email": "..."
        }
        ```
    * **Success Response (2FA Authenticator Gerekli):** (Status 200 OK)
        ```json
        {
            "success": true,
            "message": "... Authenticator kodunuzu girin.",
            "requires2FA": true,
            "method": "authenticator",
            "userId": "USER_ID",
            "username": "...",
            "email": "...",
            "tempToken": "TEMP_2FA_TOKEN"
        }
        ```
    * **Error Responses:** 400 (Eksik bilgi), 401 (Geçersiz bilgiler), 500 (Sunucu hatası).

* **`POST /verify-login-2fa`**
    * **Açıklama:** Login sonrası girilen 2FA kodunu (Email veya Authenticator) doğrular.
    * **Access:** Public
    * **Request Body (Email için):**
        ```json
        {
            "method": "email",
            "userId": "LOGIN_YANITINDAN_GELEN_USER_ID",
            "token": "KULLANICININ_GIRDIGI_6_HANELI_EMAIL_KODU"
        }
        ```
    * **Request Body (Authenticator için):**
        ```json
        {
            "method": "authenticator",
            "tempToken": "LOGIN_YANITINDAN_GELEN_TEMP_TOKEN",
            "token": "KULLANICININ_GIRDIGI_6_HANELI_AUTH_KODU"
        }
        ```
    * **Success Response:** (Status 200 OK) - 2FA Kapalı durumdaki `/login` yanıtına benzer, ana JWT token'ı içerir.
        ```json
        {
            "success": true,
            "message": "Giriş başarılı (2FA doğrulandı).",
            "token": "MAIN_JWT_TOKEN",
            "user": { "_id", "username", "email", "isAdmin", ... }
        }
        ```
    * **Error Responses:** 400 (Eksik bilgi), 401 (Geçersiz kod/token/süre).

* **`GET /me`**
    * **Açıklama:** Giriş yapmış kullanıcının bilgilerini döndürür.
    * **Access:** Private
    * **Success Response:** (Status 200 OK)
        ```json
        {
            "success": true,
            "user": { "_id", "username", "email", "isAdmin", "twoFactorEnabled", "twoFactorMethod", "createdAt" }
        }
        ```
    * **Error Responses:** 401 (Yetkisiz).

* **`POST /setup-authenticator`**
    * **Açıklama:** Google Authenticator 2FA kurulumunu başlatır, QR kod URL'si döndürür.
    * **Access:** Private
    * **Success Response:** (Status 200 OK)
        ```json
        {
            "success": true,
            "message": "Authenticator uygulamanızla QR kodunu tarayın...",
            "qrCodeUrl": "data:image/png;base64,..."
        }
        ```
    * **Error Responses:** 400 (Zaten aktif), 401, 500.

* **`POST /verify-enable-authenticator`**
    * **Açıklama:** Authenticator kurulumunu tamamlamak için girilen kodu doğrular ve metodu etkinleştirir.
    * **Access:** Private
    * **Request Body:**
        ```json
        {
            "token": "KULLANICININ_GIRDIGI_6_HANELI_AUTH_KODU"
        }
        ```
    * **Success Response:** (Status 200 OK)
        ```json
        {
            "success": true,
            "message": "Authenticator ile 2FA başarıyla etkinleştirildi."
        }
        ```
    * **Error Responses:** 400 (Eksik/Geçersiz kod), 401, 404.

* **`POST /enable-email-2fa`**
    * **Açıklama:** E-posta ile 2FA metodunu etkinleştirir.
    * **Access:** Private
    * **Success Response:** (Status 200 OK)
        ```json
        {
            "success": true,
            "message": "E-posta ile İki Adımlı Doğrulama başarıyla etkinleştirildi."
        }
        ```
    * **Error Responses:** 401, 404, 500.

* **`POST /disable-2fa`**
    * **Açıklama:** Aktif olan 2FA metodunu devre dışı bırakır.
    * **Access:** Private
    * **Success Response:** (Status 200 OK)
        ```json
        {
            "success": true,
            "message": "2FA başarıyla devre dışı bırakıldı."
        }
        ```
    * **Error Responses:** 400 (Zaten kapalı), 401, 404.

---

### 2. Customers (`/api/customers`)

* **`POST /`**
    * **Açıklama:** Yeni müşteri ekler.
    * **Access:** Private
    * **Request Body:**
        ```json
        {
            "name": "Müşteri Adı*", // Zorunlu
            "email": "musteri@email.com",
            "phone": "5xxxxxxxxx",
            "description": "Müşteri ile ilgili notlar"
        }
        ```
    * **Success Response:** (Status 201 Created)
        ```json
        {
            "success": true,
            "message": "Müşteri başarıyla eklendi.",
            "customer": { /* Yeni eklenen müşteri objesi */ }
        }
        ```
    * **Error Responses:** 400 (Eksik/Geçersiz bilgi), 401.

* **`GET /`**
    * **Açıklama:** Tüm müşterileri listeler (varsayılan olarak en yeniden eskiye).
    * **Access:** Private
    * **Success Response:** (Status 200 OK)
        ```json
        {
            "success": true,
            "count": 15, // Toplam müşteri sayısı
            "customers": [ /* Müşteri objeleri dizisi */ ]
        }
        ```
    * **Error Responses:** 401, 500.

* **`GET /:id`**
    * **Açıklama:** Belirtilen ID'ye sahip müşteriyi getirir.
    * **Access:** Private
    * **Success Response:** (Status 200 OK)
        ```json
        {
            "success": true,
            "customer": { /* İstenen müşteri objesi */ }
        }
        ```
    * **Error Responses:** 400 (Geçersiz ID formatı), 401, 404 (Müşteri bulunamadı).

* **`PUT /:id`**
    * **Açıklama:** Belirtilen ID'ye sahip müşteriyi günceller. Body'de sadece güncellenmesi istenen alanlar gönderilebilir.
    * **Access:** Private
    * **Request Body:**
        ```json
        {
            "name": "Yeni Müşteri Adı",
            "phone": "5yyyyyyy",
            // ... diğer güncellenecek alanlar
        }
        ```
    * **Success Response:** (Status 200 OK)
        ```json
        {
            "success": true,
            "message": "Müşteri başarıyla güncellendi.",
            "customer": { /* Güncellenmiş müşteri objesi */ }
        }
        ```
    * **Error Responses:** 400 (Geçersiz bilgi/ID), 401, 404.

* **`DELETE /:id`**
    * **Açıklama:** Belirtilen ID'ye sahip müşteriyi siler. (Not: İlişkili Transaction'lar varsayılan olarak silinmez).
    * **Access:** Private
    * **Success Response:** (Status 200 OK)
        ```json
        {
            "success": true,
            "message": "Müşteri başarıyla silindi."
        }
        ```
    * **Error Responses:** 400 (Geçersiz ID), 401, 404.

* **`GET /:customerId/transactions`**
    * **Açıklama:** Belirtilen müşteriye ait tüm finansal işlemleri listeler (yeniden eskiye).
    * **Access:** Private
    * **Success Response:** (Status 200 OK)
        ```json
        {
            "success": true,
            "count": 5, // Müşteriye ait işlem sayısı
            "transactions": [ /* İşlem objeleri dizisi */ ]
        }
        ```
    * **Error Responses:** 400 (Geçersiz ID), 401, 404 (Müşteri bulunamadı).

---

### 3. Transactions (`/api/transactions`)

* **`POST /`**
    * **Açıklama:** Yeni bir finansal işlem (gelen/giden) ekler.
    * **Access:** Private
    * **Request Body:**
        ```json
        {
            "customerId": "MUSTERI_ID*", // Zorunlu
            "type": "gelen",          // Zorunlu ("gelen" veya "giden")
            "amount": 1500.50,        // Zorunlu (Sayı, > 0)
            "date": "2025-04-20",     // Opsiyonel (YYYY-MM-DD formatında, yoksa bugünün tarihi)
            "description": "Nisan ayı hizmet bedeli" // Opsiyonel
        }
        ```
    * **Success Response:** (Status 201 Created)
        ```json
        {
            "success": true,
            "message": "İşlem başarıyla eklendi.",
            "transaction": { /* Yeni eklenen işlem objesi */ }
        }
        ```
    * **Error Responses:** 400 (Eksik/Geçersiz bilgi), 401, 404 (Müşteri bulunamadı).

* **`GET /`**
    * **Açıklama:** Tüm finansal işlemleri listeler (müşteri bilgileriyle birlikte, yeniden eskiye).
    * **Access:** Private
    * **Success Response:** (Status 200 OK)
        ```json
        {
            "success": true,
            "count": 50, // Toplam işlem sayısı
            "transactions": [
                {
                    "_id", "type", "amount", "date", "description", "createdAt", "updatedAt",
                    "customerId": { // Populate edilmiş müşteri bilgisi
                      "_id",
                      "name",
                      "email"
                    }
                },
                // ... diğer işlemler
             ]
        }
        ```
    * **Error Responses:** 401, 500.

---

### 4. Reports (`/api/reports`)

* **`GET /summary`**
    * **Açıklama:** Belirtilen tarih aralığı için finansal özet döndürür.
    * **Access:** Private
    * **Query Parameters:**
        * `startDate` (Zorunlu): Başlangıç tarihi (YYYY-MM-DD)
        * `endDate` (Zorunlu): Bitiş tarihi (YYYY-MM-DD)
    * **Success Response:** (Status 200 OK)
        ```json
        {
            "success": true,
            "report": {
                "startDate": "YYYY-MM-DD",
                "endDate": "YYYY-MM-DD",
                "totalIncoming": 15000, // Toplam Gelen
                "totalOutgoing": 4500,  // Toplam Giden
                "netProfit": 10500      // Net Kâr
            }
        }
        ```
    * **Error Responses:** 400 (Eksik/Geçersiz tarih), 401, 500.

* **`GET /top-customers`**
    * **Açıklama:** En çok işlem yapan müşterileri listeler (işlem sayısına göre).
    * **Access:** Private
    * **Query Parameters:**
        * `limit` (Opsiyonel): Kaç müşteri listelenecek (Varsayılan: 5)
        * `startDate` (Opsiyonel): Rapor için başlangıç tarihi (YYYY-MM-DD)
        * `endDate` (Opsiyonel): Rapor için bitiş tarihi (YYYY-MM-DD)
    * **Success Response:** (Status 200 OK)
        ```json
        {
            "success": true,
            "report": [
                {
                    "customerId": "...",
                    "name": "Çok Aktif Müşteri A.Ş.",
                    "email": "...",
                    "transactionCount": 25
                },
                {
                    "customerId": "...",
                    "name": "Diğer Aktif Müşteri",
                    "email": "...",
                    "transactionCount": 18
                },
                // ... (limit kadar müşteri)
            ]
        }
        ```
    * **Error Responses:** 400 (Geçersiz limit/tarih), 401, 500.
