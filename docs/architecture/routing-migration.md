# Routing Geçiş Planı: Wouter → React Router

## Mevcut Durum

**Kullanılan:** Wouter v3.x
- Hafif (~1.5KB gzip)
- Hook-based API
- Basit projeler için ideal

## Neden React Router?

| Özellik | Wouter | React Router |
|---------|--------|--------------|
| Bundle Size | ~1.5KB | ~12KB |
| Nested Routes | Sınırlı | Tam destek |
| Data Loading | Yok | Loaders/Actions |
| Code Splitting | Manuel | Lazy routes |
| Type Safety | Temel | Gelişmiş |
| Ekosistem | Küçük | Büyük |
| SSR Desteği | Sınırlı | Tam |

## Geçiş Adımları

### Adım 1: Bağımlılık Ekleme
```bash
npm install react-router-dom
npm uninstall wouter
```

### Adım 2: Router Yapısını Güncelleme

**Önceki (Wouter):**
```tsx
import { Switch, Route } from "wouter";

<Switch>
  <Route path="/" component={Landing} />
  <Route path="/admin/login" component={AdminLogin} />
  <Route component={NotFound} />
</Switch>
```

**Sonraki (React Router):**
```tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/admin/login", element: <AdminLogin /> },
  { path: "*", element: <NotFound /> },
]);

<RouterProvider router={router} />
```

### Adım 3: Link Bileşenlerini Güncelleme

**Önceki:**
```tsx
import { Link, useLocation } from "wouter";
const [location, setLocation] = useLocation();
setLocation("/dashboard");
```

**Sonraki:**
```tsx
import { Link, useNavigate } from "react-router-dom";
const navigate = useNavigate();
navigate("/dashboard");
```

### Adım 4: Route Parametreleri

**Önceki:**
```tsx
<Route path="/training/:id" component={TrainingDetail} />
// Component içinde:
const params = useParams();
```

**Sonraki:**
```tsx
{ path: "/training/:id", element: <TrainingDetail /> }
// Component içinde (aynı):
const { id } = useParams();
```

## Etkilenen Dosyalar

1. `client/src/App.tsx` - Ana router yapısı
2. `client/src/pages/*.tsx` - useLocation → useNavigate
3. `client/src/components/*.tsx` - Link importları

## Test Kontrol Listesi

- [ ] Tüm sayfalar erişilebilir
- [ ] Geri/ileri navigasyon çalışıyor
- [ ] 404 sayfası düzgün gösteriliyor
- [ ] Deep linking çalışıyor
- [ ] Query parametreleri korunuyor

## Uzun Vadeli: Next.js

React Router sonrası Next.js geçişi düşünülebilir:

**Avantajları:**
- SSR/SSG ile SEO optimizasyonu
- File-based routing
- API routes (Express gereksiz)
- Optimized builds
- Image optimization

**Dikkat Edilecekler:**
- Mevcut Express API'nin ayrıştırılması
- Client-side state yönetimi
- Deployment değişikliği

---

*Tahmini Süre: 2-4 saat*
*Risk Seviyesi: Düşük*
