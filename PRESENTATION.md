# CinemaHub — Project Presentation

## Slide 1: Title

**CinemaHub**  
**Review Aggregator with Emotional Analytics**

Course Project  
2025

---

## Slide 2: What is it and Why?

### Problem
- Reviews are scattered across different platforms
- No unified place for emotional reaction analysis
- Difficult to understand real perception of movies/series/games

### Solution — CinemaHub
Unified platform for:
- Collecting and aggregating reviews (movies, series, games)
- Emotional analytics of user feedback
- Personalized recommendations based on critic subscriptions
- Content management through convenient admin panel

---

## Slide 3: Key Features

### For Users
- Browse content with detailed metrics (ratings, emotional cloud)
- Subscribe to critics and get personalized scores
- Leave reviews with aspect ratings and emotional reactions

### For Administrators
- Content management (movies/series/games)
- Hero Carousel — banners on the homepage
- Coming Soon — announcements of upcoming releases
- Dashboard with analytics and statistics

### Analytics
- Emotional cloud (joy, tension, awe)
- Perception map by aspects (plot, acting, visuals)
- Rating dynamics over time

---

## Slide 4: Technology Stack

### Frontend
- **React** (Vite) — fast UI development
- **React Router** — navigation
- **Axios** — HTTP client with global timeouts
- **Recharts** — charts and visualizations
- **Lucide React** — icons
- **Tailwind CSS** — styling

### Backend
- **NestJS** — framework (Node.js + TypeScript)
- **TypeORM** — ORM for database
- **MySQL** — relational database (OLTP)
- **JWT** — authentication and authorization
- **Bcrypt** — password hashing

### Analytics (in progress)
- **Apache Kafka** — event streaming bus
- **Apache Spark (PySpark)** — stream processing
- **ClickHouse** — OLAP storage for analytics
- **Docker Compose** — local infrastructure deployment

---

## Slide 5: Architecture and Data Flow

```
┌─────────────┐
│   Browser   │ ← React (Vite)
│   (User)    │
└──────┬──────┘
       │ HTTP/REST
       ↓
┌─────────────────────────────┐
│  Backend (NestJS + MySQL)   │
│  - API endpoints            │
│  - JWT auth                 │
│  - Self-healing DDL         │
└──────┬──────────────────────┘
       │
       ├─→ MySQL (OLTP) ← reviews, users, content
       │
       ├─→ Kafka (events) ← review_created, rating_updated
       │
       ↓
┌─────────────────────┐
│  PySpark ETL        │ ← reads from Kafka
│  - JSON parsing     │
│  - data cleaning    │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│  ClickHouse (OLAP)  │ ← analytical queries
│  - reviews_events   │
│  - aggregates       │
└─────────────────────┘
       ↓
   Dashboard / Superset
```

### Data Sources
- **User input** — review forms, ratings
- **Admin panel** — content management, hero carousel, coming soon
- **Seed scripts** — test data for development
- **(Future)** Integration with external APIs (IMDb, Metacritic)

---

## Slide 6: Current Status and Plans

### ✅ Implemented
- Full-featured frontend (React + responsive UI)
- Backend API (NestJS + MySQL) with JWT authentication
- CRUD for content, hero carousel, coming soon
- Emotional analytics of reviews
- Critic subscriptions and rating personalization
- Dashboard with content and user metrics
- Analytics infrastructure (Kafka + PySpark + ClickHouse) — ready to launch

### 🚀 Planned
- Full implementation of Kafka pipeline for events
- Automated dashboards via Apache Superset
- ML recommendations based on emotional profiles
- Centralized people database (directors, actors, developers)
- Integration with external APIs for automatic import

### 🎯 Value
- **For users**: unified place to search and analyze content
- **For critics**: platform for publishing and influence
- **For administrators**: convenient management panel and analytics

---

## How to Run

### Backend
```bash
cd movie-aggregator-backend-nest
npm install
npm run start:dev
```

### Frontend
```bash
cd movie-aggregator-frontend
npm install
npm run dev
```

### Analytics (optional)
```bash
cd analytics
docker compose up -d
```

**Demo**: http://localhost:5173  
**API**: http://localhost:3000/api

---

**Thank you for your attention!**

Ready to answer questions 🎬
