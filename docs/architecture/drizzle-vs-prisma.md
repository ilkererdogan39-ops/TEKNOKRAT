# ORM Karşılaştırması: Drizzle vs Prisma

## Neden Drizzle Tercih Edildi?

Bu projede Drizzle ORM tercih edildi. Bu belge kararın arkasındaki nedenleri ve trade-off'ları açıklar.

## Karşılaştırma Tablosu

| Özellik | Drizzle | Prisma |
|---------|---------|--------|
| **Bundle Size** | ~35KB | ~2MB+ |
| **Cold Start** | Hızlı | Yavaş (engine init) |
| **Type Safety** | Excellent | Excellent |
| **SQL Kontrolü** | Tam | Sınırlı |
| **Learning Curve** | Orta | Düşük |
| **Raw SQL** | Native | `$queryRaw` |
| **Migrations** | Kit aracı | Prisma migrate |
| **Introspection** | Var | Var |
| **Edge Runtime** | Evet | Sınırlı |
| **Serverless** | Optimal | Engine overhead |

## Drizzle'ın Avantajları

### 1. Hafif Bundle
```
Drizzle: ~35KB (gzip)
Prisma:  ~2MB+ (client + engine)
```
Serverless ortamlarda (Replit, Vercel, Cloudflare) cold start süresi kritik.

### 2. SQL Yakınlığı
```typescript
// Drizzle - SQL'e çok yakın
const result = await db
  .select({
    name: participants.fullName,
    count: sql<number>`count(*)`.as('count')
  })
  .from(participants)
  .leftJoin(assignments, eq(participants.id, assignments.participantId))
  .groupBy(participants.id);

// Prisma - Abstraction katmanı
const result = await prisma.participant.findMany({
  include: {
    _count: {
      select: { assignments: true }
    }
  }
});
```

### 3. Edge Runtime Uyumu
Drizzle, Cloudflare Workers ve Vercel Edge'de native çalışır. Prisma, Data Proxy veya Accelerate gerektirir.

### 4. Relational Query Builder
```typescript
// Drizzle relational queries
const participantWithTrainings = await db.query.participants.findFirst({
  where: eq(participants.id, 1),
  with: {
    assignments: {
      with: {
        training: true
      }
    }
  }
});
```

### 5. Zod Entegrasyonu
```typescript
// drizzle-zod ile otomatik schema
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const insertParticipantSchema = createInsertSchema(participants);
export const selectParticipantSchema = createSelectSchema(participants);

// Runtime validation ready!
const validated = insertParticipantSchema.parse(req.body);
```

## Prisma'nın Avantajları

### 1. Developer Experience
- Prisma Studio (GUI database browser)
- Otomatik migration generation
- Zengin error messages

### 2. Daha Kolay Öğrenme
```typescript
// Prisma - Daha intuitive API
const user = await prisma.user.create({
  data: {
    email: 'test@test.com',
    posts: {
      create: { title: 'First Post' }
    }
  }
});
```

### 3. Ekosistem
- Prisma Accelerate (connection pooling)
- Prisma Pulse (real-time)
- Geniş community

### 4. Migration Yönetimi
```bash
# Prisma - Declarative migrations
prisma migrate dev --name add_users
prisma migrate deploy
```

## Bu Proje İçin Neden Drizzle?

### 1. Replit Ortamı
- Cold start süresi önemli
- Serverless-like environment
- Bundle size constraints

### 2. SQL Kontrolü
- Karmaşık sorgular (reports, aggregations)
- Performance optimization ihtiyacı
- Raw SQL familiarity

### 3. Zod ile Uyum
- Aynı şemayı backend/frontend'de kullanma
- Runtime validation
- Form integration (react-hook-form)

### 4. Edge-Ready
- Gelecekte Cloudflare/Vercel edge deployment
- Minimal dependencies

## Trade-offs Kabul Edildi

### Dezavantajlar
1. **Migration tooling** daha basit (drizzle-kit)
2. **GUI tool yok** (Prisma Studio gibi)
3. **Daha fazla SQL bilgisi gerekli**
4. **Daha az community resource**

### Mitigasyonlar
1. Migration'lar `drizzle-kit push` ile yönetiliyor
2. pgAdmin veya Replit DB pane kullanılabilir
3. Takım SQL biliyor
4. Drizzle community hızla büyüyor

## Geçiş Senaryosu

Gelecekte Prisma'ya geçiş gerekirse:

### Adım 1: Schema Dönüşümü
```prisma
// Drizzle schema'dan Prisma schema'ya
model Participant {
  id         Int      @id @default(autoincrement())
  employeeId String   @unique
  fullName   String
  email      String   @unique
  department String
  password   String?
  
  assignments Assignment[]
}
```

### Adım 2: Query Migration
```typescript
// Drizzle
const p = await db.select().from(participants).where(eq(participants.id, 1));

// Prisma
const p = await prisma.participant.findUnique({ where: { id: 1 } });
```

### Tahmini Effort
- Schema: 2-4 saat
- Queries: 1-2 gün
- Testing: 1-2 gün
- **Toplam: 3-5 gün**

## Sonuç

| Kriter | Karar |
|--------|-------|
| Bu proje için | **Drizzle ✓** |
| Enterprise/Large team | Prisma |
| Edge deployment | Drizzle |
| Rapid prototyping | Prisma |
| SQL expertise | Drizzle |
| Junior developers | Prisma |

Drizzle, bu projenin gereksinimleri için doğru seçimdir. Lightweight, SQL-first yaklaşım ve Zod entegrasyonu avantaj sağlar.

---

*Hazırlayan: Sistem Mimarisi*
*Tarih: Ocak 2026*
