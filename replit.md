# Kurumsal Eğitim Yönetim Sistemi (LMS)

## Overview
A Corporate Training Management System built in Turkish. The platform enables organizations to manage employee training programs, assign video-based trainings to participants, and track completion progress.

## Features

### Admin Panel
- **User Management**: Create, edit, delete participants with employee ID, name, department, email
- **CSV Import**: Bulk import participants from CSV files (supports Turkish characters with Windows-1254/UTF-8 encoding)
- **Training Assignment**: Create video trainings (YouTube/Vimeo) and assign to multiple participants
- **Reports**: View completion statistics per participant and per training
- **Messages**: View and reply to participant messages

### Future Enhancements (Not Yet Implemented)
- **Email Notifications**: Send email when trainings are assigned (requires SMTP or Resend integration)

### Participant Panel
- **Streamlined Login**: Returning users with saved credentials go directly to password entry (localStorage-based)
- **Training Dashboard**: View assigned trainings with thumbnails and progress
- **Video Player**: Watch embedded training videos with enforced viewing (no seeking, 90% completion required)
- **Video Progress Persistence**: Video progress saved to database - resume from where you left off across sessions
- **Completion Tracking**: Mark trainings as complete with progress tracking
- **Messaging**: Send messages to admin and view replies

## Technical Stack

### Frontend
- React with TypeScript
- React Router v7 for routing (BrowserRouter/Routes/Route pattern)
- TanStack Query for data fetching
- Tailwind CSS with shadcn/ui components
- Dark mode support via ThemeProvider

### Backend
- Express.js API server with layered architecture
- Middleware layer (errorHandler, validation)
- Repository layer (data access abstraction)
- Service layer (business logic)
- PostgreSQL database with Drizzle ORM
- Zod for request validation

### Testing
- Vitest for unit testing
- 55 passing tests across 5 test files
- Run tests: `npx vitest run`

### Database
- PostgreSQL (Neon-backed)
- Drizzle ORM for type-safe queries
- Tables: participants, trainings, training_assignments, messages, users, video_watch_logs

## Key Routes

### Frontend
- `/` - Landing page with role selection
- `/admin/login` - Admin login (credentials: admin / admin123)
- `/admin/dashboard` - Admin dashboard with tabs
- `/participant/login` - Participant login (email/password)
- `/participant/dashboard` - Participant training dashboard

### API Endpoints
- `GET/POST /api/participants` - List/create participants
- `PATCH/DELETE /api/participants/:id` - Update/delete participant
- `POST /api/participants/identify` - Identify participant by employee ID + email
- `POST /api/participants/set-password` - Set password for first-time users
- `POST /api/participants/login` - Participant login with password
- `POST /api/participants/import` - CSV import (no password required, users set on first login)
- `GET /api/trainings` - List trainings
- `POST /api/trainings/assign` - Create and assign training
- `DELETE /api/trainings/:id` - Delete training
- `GET /api/assignments` - List all assignments
- `GET /api/my-trainings/:participantId` - Get participant's trainings
- `POST /api/assignments/:id/complete` - Mark training complete
- `GET /api/video-progress/:assignmentId` - Get video progress for assignment
- `POST /api/video-progress` - Save video progress (persisted to database)
- `GET /api/video-progress/:assignmentId/logs` - Get video watch history
- `DELETE /api/reset` - Reset all data

## Security
- Passwords are stripped from all API responses
- Admin credentials: username `admin`, password `1`
- Data persists in PostgreSQL database (survives server restarts)
- Video progress ownership validated before saving

## Project Structure
```
client/
├── src/
│   ├── components/
│   │   ├── admin/          # Admin dashboard components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── VideoPlayer.tsx # Video player with progress tracking
│   │   └── ThemeToggle.tsx
│   ├── lib/
│   │   ├── AuthContext.tsx # Authentication state
│   │   ├── ThemeProvider.tsx # Dark mode
│   │   └── queryClient.ts
│   ├── pages/              # Page components (React Router v7)
│   └── App.tsx
server/
├── middleware/
│   ├── errorHandler.ts     # Centralized error handling + custom error classes
│   └── validation.ts       # Zod-based request validation
├── repositories/           # Data access layer
│   ├── participantRepository.ts
│   ├── trainingRepository.ts
│   ├── assignmentRepository.ts
│   ├── messageRepository.ts
│   ├── videoProgressRepository.ts
│   └── systemRepository.ts
├── services/               # Business logic layer
│   ├── participantService.ts
│   ├── trainingService.ts
│   ├── assignmentService.ts
│   ├── messageService.ts
│   ├── videoProgressService.ts
│   └── systemService.ts
├── tests/                  # Unit tests (Vitest)
│   ├── participantService.test.ts
│   ├── trainingService.test.ts
│   ├── assignmentService.test.ts
│   ├── errorHandler.test.ts
│   └── systemService.test.ts
├── db.ts                   # Database connection (Drizzle + PostgreSQL)
├── routes.ts               # API endpoints (thin routes delegating to services)
├── storage.ts              # Legacy storage class (being deprecated)
└── index.ts
shared/
└── schema.ts               # Drizzle ORM table definitions & Zod validation
```

## Development
- Run `npm run dev` to start the development server
- Run `npm run db:push` to sync database schema
- Frontend serves on port 5000
- Hot module replacement enabled

## Architecture Documentation

Detailed architecture documentation is available in `docs/architecture/`:

| Document | Description |
|----------|-------------|
| [README.md](docs/architecture/README.md) | Overview and roadmap |
| [routing-migration.md](docs/architecture/routing-migration.md) | Wouter → React Router migration plan |
| [backend-layering.md](docs/architecture/backend-layering.md) | Controller-Service-Repository architecture |
| [notification-design.md](docs/architecture/notification-design.md) | Email and background job design |
| [testing-strategy.md](docs/architecture/testing-strategy.md) | Test pyramid and CI/CD setup |
| [drizzle-vs-prisma.md](docs/architecture/drizzle-vs-prisma.md) | ORM comparison and rationale |

## Modernization Roadmap

### Phase 1: Stabilization ✅ COMPLETE
- [x] Wouter → React Router v7 migration
- [x] Backend layered architecture (Repository-Service pattern)
- [x] Centralized error handler with custom error classes
- [x] Zod-based validation middleware
- [x] Basic test infrastructure (Vitest with 55 passing tests)

### Phase 2: Enterprise Infrastructure (2-4 weeks)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Redis + BullMQ notification system
- [ ] Email notification service (Resend)
- [ ] Comprehensive test coverage (80%+)
- [ ] Controller layer restructuring

### Phase 3: Future Vision (Optional)
- [ ] Next.js migration (SSR/SSG)
- [x] NestJS backend - **Evaluated but not adopted**: tsx runtime doesn't support emitDecoratorMetadata required for NestJS DI. Express with layered architecture provides equivalent patterns.
- [ ] Microservices architecture

## Architecture Decision: Express vs NestJS

**Decision**: Keep Express with strict layered architecture (Repository-Service-Routes pattern)

**Rationale**:
1. **tsx Compatibility**: NestJS requires `emitDecoratorMetadata` for dependency injection, which tsx doesn't support properly
2. **Pattern Equivalence**: Express with Repository-Service-Routes provides same separation of concerns as NestJS
3. **Simpler Stack**: No additional runtime dependencies or decorator complexity
4. **Proven Stability**: Current architecture has 55+ passing tests

**Current Architecture Layers**:
- **Routes** (server/routes.ts): Thin HTTP layer, request validation, delegates to services
- **Services** (server/services/): Business logic, orchestrates repositories
- **Repositories** (server/repositories/): Data access abstraction, Drizzle ORM queries
- **Middleware** (server/middleware/): Cross-cutting concerns (error handling, validation)
