# Kurumsal LMS - Deployment Rehberi

Bu rehber, LMS sistemini farklı platformlara nasıl deploy edeceğinizi anlatır.

## Gerekli Ortam Değişkenleri

| Değişken | Açıklama | Örnek |
|----------|----------|-------|
| `DATABASE_URL` | PostgreSQL bağlantı adresi | `postgresql://user:pass@host:5432/dbname` |
| `SESSION_SECRET` | Oturum güvenliği için gizli anahtar | `rastgele-uzun-gizli-anahtar-123` |
| `PORT` | Uygulama portu (varsayılan: 5000) | `5000` |
| `NODE_ENV` | Ortam tipi | `production` |

---

## Seçenek 1: Railway.app (Önerilen - En Kolay)

Railway, modern uygulamalar için en kolay deployment platformudur.

### Adımlar:

1. **GitHub'a Yükle**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/KULLANICI/lms-system.git
   git push -u origin main
   ```

2. **Railway Hesabı Oluştur**
   - https://railway.app adresine git
   - GitHub ile giriş yap

3. **Yeni Proje Oluştur**
   - "New Project" > "Deploy from GitHub repo"
   - Repository'yi seç

4. **PostgreSQL Ekle**
   - "+ New" > "Database" > "Add PostgreSQL"
   - Railway otomatik olarak DATABASE_URL'i bağlar

5. **Ortam Değişkenlerini Ekle**
   - Variables sekmesine git
   - `SESSION_SECRET` ekle (rastgele uzun bir string)

6. **Deploy Et**
   - Railway otomatik olarak build ve deploy eder
   - Birkaç dakika içinde URL alırsın

**Maliyet**: Aylık ~$5-10 (kullanıma göre)

---

## Seçenek 2: Render.com

### Adımlar:

1. **Render Hesabı Oluştur**
   - https://render.com
   - GitHub ile bağlan

2. **PostgreSQL Oluştur**
   - "New" > "PostgreSQL"
   - "Free" tier seçilebilir (90 gün)

3. **Web Service Oluştur**
   - "New" > "Web Service"
   - GitHub repo'yu bağla
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

4. **Ortam Değişkenleri**
   - DATABASE_URL: PostgreSQL'den kopyala
   - SESSION_SECRET: Rastgele string
   - NODE_ENV: production

**Maliyet**: Ücretsiz tier mevcut, production için ~$7/ay

---

## Seçenek 3: Docker ile VPS/Sunucu

Kendi sunucunuzda çalıştırmak için Docker kullanabilirsiniz.

### Gereksinimler:
- Ubuntu 20.04+ veya CentOS 8+
- Docker ve Docker Compose kurulu
- En az 1GB RAM, 10GB disk

### Kurulum:

1. **Docker Kur**
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```

2. **Projeyi Sunucuya Kopyala**
   ```bash
   git clone https://github.com/KULLANICI/lms-system.git
   cd lms-system
   ```

3. **Ortam Değişkenlerini Ayarla**
   ```bash
   # .env dosyası oluştur
   echo "POSTGRES_PASSWORD=guclu-sifre-123" > .env
   echo "SESSION_SECRET=cok-gizli-anahtar-456" >> .env
   ```

4. **Docker Compose ile Başlat**
   ```bash
   docker-compose up -d
   ```

5. **Durumu Kontrol Et**
   ```bash
   docker-compose logs -f
   ```

6. **Nginx Reverse Proxy (Opsiyonel)**
   ```nginx
   server {
       listen 80;
       server_name lms.sirketiniz.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### SSL Sertifikası (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d lms.sirketiniz.com
```

---

## Seçenek 4: Fly.io

### Adımlar:

1. **Fly CLI Kur**
   ```bash
   curl -L https://fly.io/install.sh | sh
   fly auth login
   ```

2. **Uygulama Oluştur**
   ```bash
   fly launch
   # Dockerfile kullanılacak
   ```

3. **PostgreSQL Ekle**
   ```bash
   fly postgres create
   fly postgres attach
   ```

4. **Secrets Ekle**
   ```bash
   fly secrets set SESSION_SECRET=gizli-anahtar-123
   ```

5. **Deploy**
   ```bash
   fly deploy
   ```

**Maliyet**: ~$5-10/ay

---

## Veritabanı Migrasyonu

Yeni ortamda veritabanı şemasını oluşturmak için:

```bash
# Drizzle ile şema push
npm run db:push
```

---

## Yedekleme

### PostgreSQL Yedekleme
```bash
# Yedek al
pg_dump -U kullanici -h host -d database > yedek_$(date +%Y%m%d).sql

# Yedekten geri yükle
psql -U kullanici -h host -d database < yedek.sql
```

### Docker ile Yedekleme
```bash
docker exec lms_postgres pg_dump -U lmsuser lms_database > yedek.sql
```

---

## Sorun Giderme

### Uygulama başlamıyor
- Logları kontrol et: `docker-compose logs app`
- DATABASE_URL doğru mu kontrol et
- Port 5000 açık mı kontrol et

### Veritabanı bağlantı hatası
- PostgreSQL çalışıyor mu: `docker-compose ps`
- Bağlantı bilgileri doğru mu

### Build hatası
- `npm run build` yerel olarak çalışıyor mu test et
- Node.js 20+ kullanıldığından emin ol

---

## Destek

Sorularınız için:
- gr_egitim@aydinli.com.tr
- ilker.erdogan@aydinli.com.tr
