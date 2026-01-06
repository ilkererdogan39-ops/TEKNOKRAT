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
- **Video Progress Persistence**: Video progress saved to localStorage - resume from where you left off
- **Completion Tracking**: Mark trainings as complete with progress tracking
- **Messaging**: Send messages to admin and view replies

## Technical Stack

### Frontend
- React with TypeScript
- Wouter for routing
- TanStack Query for data fetching
- Tailwind CSS with shadcn/ui components
- Dark mode support via ThemeProvider

### Backend
- Express.js API server
- PostgreSQL database with Drizzle ORM
- Zod for request validation

### Database
- PostgreSQL (Neon-backed)
- Drizzle ORM for type-safe queries
- Tables: participants, trainings, training_assignments, messages, users

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
- `DELETE /api/reset` - Reset all data

## Security
- Passwords are stripped from all API responses
- Admin credentials: username `admin`, password `admin123`
- Data persists in PostgreSQL database (survives server restarts)

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
│   ├── pages/              # Page components
│   └── App.tsx
server/
├── db.ts                   # Database connection (Drizzle + PostgreSQL)
├── routes.ts               # API endpoints
├── storage.ts              # Database storage class
└── index.ts
shared/
└── schema.ts               # Drizzle ORM table definitions & Zod validation
```

## Development
- Run `npm run dev` to start the development server
- Run `npm run db:push` to sync database schema
- Frontend serves on port 5000
- Hot module replacement enabled
