# Al Mokhtabar Laboratory
# المختبر | Al Mokhtabar Laboratory

> World-class digital healthcare ecosystem — the most advanced laboratory platform in the Middle East.

## Architecture

```
al-mokhtabar-lab/
├── packages/
│   ├── backend/         # Fastify + Prisma + PostgreSQL API
│   ├── web/             # Next.js 14 Frontend (Arabic-first)
│   ├── mobile/          # React Native App
│   ├── ai-service/      # Python FastAPI AI Analysis
│   └── shared/          # Shared types & utilities
├── docker/              # Docker configs & Nginx
├── .github/workflows/   # CI/CD Pipeline
└── scripts/             # DevOps & deployment scripts
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TypeScript, TailwindCSS |
| Backend | Node.js, Fastify, Prisma ORM |
| Database | PostgreSQL 16, Redis 7 |
| AI Service | Python, FastAPI, NumPy, scikit-learn |
| Search | Meilisearch |
| Storage | S3 (MinIO) |
| Queue | BullMQ |
| Mobile | React Native / Expo |
| CI/CD | GitHub Actions |
| Container | Docker + Docker Compose |
| Reverse Proxy | Nginx |

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/your-org/al-mokhtabar-lab.git
cd al-mokhtabar-lab
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your values

# 3. Start infrastructure
docker-compose up -d postgres redis meilisearch minio

# 4. Setup database
cd packages/backend
npx prisma migrate dev
npx prisma db seed

# 5. Start development
npm run dev
```

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@almokhtabar.com | Admin@123 |
| Patient | patient@example.com | Patient@123 |

## Key Features

- **Arabic-first UI** with full RTL support and bilingual (AR/EN)
- **150+ lab tests** with detailed descriptions and reference ranges
- **AI-powered insights** for lab results analysis
- **Home sample collection** with real-time tracking
- **Digital reports** with QR-verified authenticity
- **Insurance integration** (Nphies, CCHI, Wasfaty)
- **Multiple payment methods** (Mada, STC Pay, Apple Pay, Tabby, Tamara)
- **Multi-branch management** with real-time analytics
- **HIPAA/GDPR compliance** with end-to-end encryption
- **Mobile responsive** with dedicated apps (planned)

## API Documentation

Swagger UI available at: `http://localhost:3001/docs`

## Database Schema

The schema includes 20+ models covering:
- Users, Authentication & RBAC
- Patients & Medical Records
- Lab Tests Catalog
- Orders & Sample Collection
- Reports & Results
- Appointments & Scheduling
- Billing & Payments
- Notifications
- Audit Logs

## Deployment

### Production (Docker)
```bash
docker-compose --profile production up -d
```

### Manual
```bash
npm run build
npm run start
```

## License

Proprietary - Al Mokhtabar Laboratory © 2024
