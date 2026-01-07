# TEKNOKRAT LMS - Mimari Dokümantasyonu

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Mevcut Mimari](#mevcut-mimari)
3. [Yol Haritası](#yol-haritası)
4. [Dokümantasyon Dosyaları](#dokümantasyon-dosyaları)

---

## Genel Bakış

TEKNOKRAT LMS, kurumsal eğitim yönetimi için geliştirilmiş bir web uygulamasıdır. Mevcut yapı hızlı geliştirme odaklıdır; bu dokümantasyon kurumsal seviyeye geçiş planını içerir.

## Mevcut Mimari

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  React + TypeScript + Tailwind CSS + shadcn/ui               │
│  Routing: Wouter | State: TanStack Query                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│  Express.js + TypeScript                                     │
│  Validation: Zod | ORM: Drizzle                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       PostgreSQL                             │
│  Neon-backed managed database                                │
└─────────────────────────────────────────────────────────────┘
```

## Yol Haritası

### Faz 1: Stabilizasyon (1-2 Hafta)
- [ ] Wouter → React Router geçişi
- [ ] Backend katmanlı mimari (Controller-Service-Repository)
- [ ] Merkezi error handler
- [ ] Validation middleware'leri
- [ ] Temel test altyapısı (Vitest)

### Faz 2: Kurumsal Altyapı (2-4 Hafta)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Redis + BullMQ notification sistemi
- [ ] E-posta bildirim servisi
- [ ] Kapsamlı test coverage (%80+)
- [ ] API dokümantasyonu (OpenAPI/Swagger)

### Faz 3: Gelecek Vizyonu (İsteğe Bağlı)
- [ ] Next.js'e geçiş (SSR/SSG desteği)
- [ ] NestJS backend (tam kurumsal)
- [ ] Mikroservis mimarisi
- [ ] Kubernetes deployment

## Dokümantasyon Dosyaları

| Dosya | Açıklama |
|-------|----------|
| [routing-migration.md](./routing-migration.md) | Wouter → React Router geçiş planı |
| [backend-layering.md](./backend-layering.md) | Katmanlı mimari detayları |
| [notification-design.md](./notification-design.md) | Bildirim sistemi tasarımı |
| [testing-strategy.md](./testing-strategy.md) | Test stratejisi ve araçları |
| [drizzle-vs-prisma.md](./drizzle-vs-prisma.md) | ORM karşılaştırması |

---

*Son Güncelleme: Ocak 2026*
