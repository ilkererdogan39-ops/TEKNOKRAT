# Test Stratejisi ve CI/CD

## Test Piramidi

```
        ┌───────────────┐
        │    E2E        │  ← Playwright/Cypress (az)
        │    Tests      │
        ├───────────────┤
        │  Integration  │  ← API tests, DB tests (orta)
        │    Tests      │
        ├───────────────┤
        │    Unit       │  ← Vitest (çok)
        │    Tests      │
        └───────────────┘
```

## Araç Seçimi

| Katman | Araç | Neden |
|--------|------|-------|
| Unit | Vitest | Hızlı, Vite uyumu, Jest uyumlu API |
| Integration | Supertest | Express API testing |
| Component | React Testing Library | User-centric testing |
| E2E | Playwright | Cross-browser, reliable |

## Dosya Yapısı

```
├── vitest.config.ts
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   │   └── participantService.test.ts
│   │   └── utils/
│   │       └── validation.test.ts
│   ├── integration/
│   │   ├── api/
│   │   │   ├── participants.test.ts
│   │   │   └── trainings.test.ts
│   │   └── db/
│   │       └── storage.test.ts
│   ├── components/
│   │   ├── VideoPlayer.test.tsx
│   │   └── Reports.test.tsx
│   └── e2e/
│       ├── admin-flow.spec.ts
│       └── participant-flow.spec.ts
├── client/src/
│   └── components/
│       └── __tests__/
└── server/
    └── __tests__/
```

## Vitest Konfigürasyonu

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared')
    }
  }
});
```

## Örnek Testler

### Unit Test
```typescript
// tests/unit/services/participantService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ParticipantService } from '@/server/services/participantService';

describe('ParticipantService', () => {
  let service: ParticipantService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      findAll: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn()
    };
    service = new ParticipantService(mockRepo);
  });

  describe('create', () => {
    it('should create participant when email is unique', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue({ id: 1, email: 'test@test.com' });

      const result = await service.create({
        employeeId: 'EMP001',
        fullName: 'Test User',
        email: 'test@test.com',
        department: 'IT'
      });

      expect(result.id).toBe(1);
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it('should throw error when email exists', async () => {
      mockRepo.findByEmail.mockResolvedValue({ id: 1 });

      await expect(service.create({
        employeeId: 'EMP001',
        fullName: 'Test User',
        email: 'existing@test.com',
        department: 'IT'
      })).rejects.toThrow('Bu e-posta zaten kayıtlı');
    });
  });
});
```

### Integration Test
```typescript
// tests/integration/api/participants.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '@/server/index';

describe('Participants API', () => {
  beforeAll(async () => {
    // Setup test database
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('GET /api/participants', () => {
    it('should return all participants', async () => {
      const response = await request(app)
        .get('/api/participants')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/participants', () => {
    it('should create a new participant', async () => {
      const response = await request(app)
        .post('/api/participants')
        .send({
          employeeId: 'TEST001',
          fullName: 'Test Katılımcı',
          email: 'test@example.com',
          department: 'Test'
        })
        .expect(201);

      expect(response.body.employeeId).toBe('TEST001');
    });

    it('should reject invalid data', async () => {
      await request(app)
        .post('/api/participants')
        .send({ employeeId: 'TEST' }) // missing required fields
        .expect(400);
    });
  });
});
```

### Component Test
```typescript
// tests/components/VideoPlayer.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoPlayer } from '@/client/src/components/VideoPlayer';

describe('VideoPlayer', () => {
  const mockProps = {
    videoUrl: 'https://youtube.com/watch?v=abc123',
    assignmentId: 1,
    onComplete: vi.fn(),
    onBack: vi.fn()
  };

  it('renders video player with back button', () => {
    render(<VideoPlayer {...mockProps} />);
    
    expect(screen.getByTestId('button-back')).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', () => {
    render(<VideoPlayer {...mockProps} />);
    
    fireEvent.click(screen.getByTestId('button-back'));
    
    expect(mockProps.onBack).toHaveBeenCalled();
  });

  it('shows loading state initially', () => {
    render(<VideoPlayer {...mockProps} />);
    
    expect(screen.getByText(/yükleniyor/i)).toBeInTheDocument();
  });
});
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run typecheck
      
      - name: Run tests
        run: npm test -- --coverage
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  build:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "e2e": "playwright test"
  }
}
```

## Coverage Hedefleri

| Kategori | Hedef | Öncelik |
|----------|-------|---------|
| Services | %90+ | Yüksek |
| Controllers | %80+ | Yüksek |
| Utils | %95+ | Orta |
| Components | %70+ | Orta |
| E2E Critical Paths | %100 | Yüksek |

## Kritik Test Senaryoları

### Must-Have
- [ ] Participant CRUD işlemleri
- [ ] Training atama akışı
- [ ] Video progress kaydetme
- [ ] Admin login
- [ ] Participant login
- [ ] CSV import (encoding handling)

### Nice-to-Have
- [ ] Maintenance mode toggle
- [ ] Password change flow
- [ ] Message sending/receiving
- [ ] Dark mode toggle

---

*Tahmini Süre: 1 hafta (temel setup)*
*Risk Seviyesi: Düşük*
