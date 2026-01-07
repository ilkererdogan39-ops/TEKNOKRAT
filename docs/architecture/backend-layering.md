# Backend Katmanlı Mimari

## Mevcut Yapı

```
server/
├── index.ts      # Express app + Vite setup
├── routes.ts     # Tüm route'lar tek dosyada
├── storage.ts    # Database operations
└── db.ts         # Drizzle connection
```

**Sorunlar:**
- routes.ts çok büyük (~800+ satır)
- Business logic route handler'larda
- Error handling dağınık
- Test edilmesi zor

## Hedef Mimari

```
server/
├── index.ts
├── db.ts
├── config/
│   └── constants.ts
├── middleware/
│   ├── errorHandler.ts
│   ├── validation.ts
│   └── auth.ts
├── controllers/
│   ├── participantController.ts
│   ├── trainingController.ts
│   ├── assignmentController.ts
│   └── messageController.ts
├── services/
│   ├── participantService.ts
│   ├── trainingService.ts
│   ├── assignmentService.ts
│   └── notificationService.ts
├── repositories/
│   ├── participantRepository.ts
│   ├── trainingRepository.ts
│   └── assignmentRepository.ts
├── routes/
│   ├── index.ts
│   ├── participantRoutes.ts
│   ├── trainingRoutes.ts
│   └── adminRoutes.ts
└── types/
    └── index.ts
```

## Katman Sorumlulukları

### 1. Controllers
HTTP request/response işleme. Business logic YOK.

```typescript
// controllers/participantController.ts
export class ParticipantController {
  constructor(private service: ParticipantService) {}

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const participants = await this.service.findAll();
      res.json(participants);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body; // validated by middleware
      const participant = await this.service.create(data);
      res.status(201).json(participant);
    } catch (error) {
      next(error);
    }
  }
}
```

### 2. Services
Business logic. Validation. Orchestration.

```typescript
// services/participantService.ts
export class ParticipantService {
  constructor(private repo: ParticipantRepository) {}

  async findAll() {
    return this.repo.findAll();
  }

  async create(data: InsertParticipant) {
    // Business logic
    const existing = await this.repo.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Bu e-posta zaten kayıtlı');
    }
    
    // Hash password if provided
    if (data.password) {
      data.password = await hashPassword(data.password);
    }
    
    return this.repo.create(data);
  }
}
```

### 3. Repositories
Database operations ONLY. No business logic.

```typescript
// repositories/participantRepository.ts
export class ParticipantRepository {
  async findAll() {
    return db.select().from(participants);
  }

  async findById(id: number) {
    return db.select().from(participants).where(eq(participants.id, id));
  }

  async create(data: InsertParticipant) {
    return db.insert(participants).values(data).returning();
  }
}
```

## Middleware'ler

### Error Handler
```typescript
// middleware/errorHandler.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code
    });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Sunucu hatası'
  });
};
```

### Validation Middleware
```typescript
// middleware/validation.ts
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: error.errors
        });
      }
      next(error);
    }
  };
};
```

## Route Organizasyonu

```typescript
// routes/participantRoutes.ts
const router = Router();
const controller = new ParticipantController(participantService);

router.get('/', controller.getAll.bind(controller));
router.post('/', validate(insertParticipantSchema), controller.create.bind(controller));
router.patch('/:id', validate(updateParticipantSchema), controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

export default router;

// routes/index.ts
app.use('/api/participants', participantRoutes);
app.use('/api/trainings', trainingRoutes);
app.use('/api/admin', adminRoutes);
```

## Geçiş Stratejisi

1. **Faz 1:** Middleware'leri oluştur (errorHandler, validation)
2. **Faz 2:** Repository katmanını ayır
3. **Faz 3:** Service katmanını oluştur
4. **Faz 4:** Controller'lara refactor et
5. **Faz 5:** Route'ları modüllere ayır

## NestJS Hazırlığı

Bu yapı NestJS'e geçişi kolaylaştırır:

| Express Pattern | NestJS Equivalent |
|-----------------|-------------------|
| Controller class | @Controller decorator |
| Service class | @Injectable service |
| Repository class | TypeORM/Drizzle repository |
| Middleware | Guards, Pipes, Interceptors |

---

*Tahmini Süre: 1-2 hafta*
*Risk Seviyesi: Orta*
