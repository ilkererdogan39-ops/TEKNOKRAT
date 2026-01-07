# Bildirim ve Background Job Mimarisi

## Gereksinimler

1. **E-posta Bildirimleri**
   - Eğitim atandığında katılımcıya mail
   - Eğitim tamamlandığında admin'e rapor
   - Hatırlatma mailleri (opsiyonel)

2. **Background Jobs**
   - Toplu e-posta gönderimi
   - Rapor oluşturma
   - CSV import işleme
   - Video progress aggregation

3. **Real-time Bildirimler**
   - Admin panelinde canlı izleme (mevcut)
   - Push notifications (gelecek)

## Mimari Seçenekleri

### Seçenek A: Redis + BullMQ

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Express   │ ──▶  │    Redis    │ ◀──  │   Worker    │
│   Server    │      │   (Queue)   │      │  Process    │
└─────────────┘      └─────────────┘      └─────────────┘
                                                 │
                                                 ▼
                                          ┌─────────────┐
                                          │   Resend    │
                                          │   (Email)   │
                                          └─────────────┘
```

**Avantajları:**
- Tam kontrol
- Retry/dead letter queue
- Job scheduling
- Priority queues

**Dezavantajları:**
- Redis hosting gerekli
- Worker process yönetimi
- Daha karmaşık setup

**Örnek Kod:**
```typescript
// jobs/emailQueue.ts
import { Queue, Worker } from 'bullmq';
import { Resend } from 'resend';

const connection = { host: process.env.REDIS_HOST };

export const emailQueue = new Queue('emails', { connection });

const worker = new Worker('emails', async (job) => {
  const { to, subject, html } = job.data;
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  await resend.emails.send({
    from: 'noreply@teknokrat.com',
    to,
    subject,
    html
  });
}, { connection });

// Kullanım
await emailQueue.add('training-assigned', {
  to: participant.email,
  subject: 'Yeni Eğitim Atandı',
  html: renderTemplate('training-assigned', { training, participant })
});
```

### Seçenek B: SaaS Queue (Trigger.dev / Inngest)

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Express   │ ──▶  │ Trigger.dev │ ──▶  │   Resend    │
│   Server    │      │   (SaaS)    │      │   (Email)   │
└─────────────┘      └─────────────┘      └─────────────┘
```

**Avantajları:**
- Managed infrastructure
- Built-in monitoring
- Easy setup
- Generous free tier

**Dezavantajları:**
- Vendor lock-in
- Sınırlı customization
- Pricing at scale

### Seçenek C: Simple In-Process (Kısa Vadeli)

```typescript
// services/notificationService.ts
export class NotificationService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async sendTrainingAssigned(participant: Participant, training: Training) {
    // Fire and forget (non-blocking)
    setImmediate(async () => {
      try {
        await this.resend.emails.send({
          from: 'noreply@teknokrat.com',
          to: participant.email,
          subject: `Yeni Eğitim: ${training.title}`,
          html: this.renderEmail('training-assigned', { participant, training })
        });
      } catch (error) {
        console.error('Email gönderimi başarısız:', error);
        // TODO: Retry logic or dead letter queue
      }
    });
  }
}
```

**Avantajları:**
- Hiç altyapı gerektirmez
- Hızlı implementasyon
- Basit debugging

**Dezavantajları:**
- Server restart'ta job kaybı
- Retry yok
- Scale olmaz

## Önerilen Yaklaşım

### Faz 1: Basit Başla
1. Resend entegrasyonu ekle
2. NotificationService oluştur
3. setImmediate ile async gönderim
4. Error logging

### Faz 2: Redis + BullMQ
1. Upstash Redis (Replit entegrasyonu)
2. BullMQ queue setup
3. Worker process
4. Dashboard (Bull Board)

### Faz 3: Advanced Features
1. Email templates (React Email)
2. Scheduled jobs (hatırlatmalar)
3. Webhook receivers
4. Analytics

## E-posta Şablonları

```typescript
// templates/training-assigned.tsx
import { Html, Head, Body, Container, Text, Button } from '@react-email/components';

export const TrainingAssignedEmail = ({ participant, training }) => (
  <Html>
    <Head />
    <Body style={{ fontFamily: 'sans-serif' }}>
      <Container>
        <Text>Merhaba {participant.fullName},</Text>
        <Text>
          Size yeni bir eğitim atandı: <strong>{training.title}</strong>
        </Text>
        <Button href={`${process.env.APP_URL}/participant/dashboard`}>
          Eğitime Git
        </Button>
      </Container>
    </Body>
  </Html>
);
```

## Monitoring

### BullMQ Dashboard
```typescript
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter
});

app.use('/admin/queues', serverAdapter.getRouter());
```

## Gerekli Paketler

```json
{
  "dependencies": {
    "bullmq": "^5.x",
    "ioredis": "^5.x",
    "resend": "^2.x",
    "@react-email/components": "^0.x"
  },
  "devDependencies": {
    "@bull-board/api": "^5.x",
    "@bull-board/express": "^5.x"
  }
}
```

---

*Tahmini Süre: 3-5 gün (Faz 1)*
*Risk Seviyesi: Düşük-Orta*
