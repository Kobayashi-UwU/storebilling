# Store Billing System

A complete POS-style billing system for brick-and-mortar stores. It includes a Node.js + Express API, PostgreSQL database, and a responsive React (Vite + TailwindCSS) frontend that employees use at `http://localhost:3001`. Everything runs in Docker via a single `docker-compose up -d` command.

## Tech Stack

- **Frontend:** React 18, Vite, TypeScript, TailwindCSS, Headless UI
- **Backend:** Node.js 20, Express, pg
- **Database:** PostgreSQL 15 (with optional pgAdmin)
- **Utilities:** Sharp for image compression, browser-image-compression on the client
- **Containerization:** Docker + docker-compose

## Folder Structure

```
storebilling/
├─ backend/
│  ├─ src/ (Express app, routes, utilities)
│  ├─ migrations/ (SQL schema)
│  ├─ seed/ (sample data)
│  ├─ scripts/ (migration + startup helpers)
│  └─ Dockerfile
├─ frontend/
│  ├─ src/components, hooks, pages, utils
│  └─ Dockerfile
├─ docker-compose.yml
└─ README.md
```

## Features

### Homepage (`/`)
- Date selector (defaults to today) to view bills
- Floating `+ Create Bill` action opens a modal to assemble a bill
- Tap any bill card to review full details, update the purchase with the same form used to create it, or delete it entirely
- Bill creation/editing flow supports searching existing items, adding quantities, manual final totals (discount), and auto-calculated subtotals
- Daily revenue widget shows final revenue for the selected date

### Dashboard (`/dashboard`)
- Pick any range (up to 60 days) to analyze performance
- Interactive area and bar charts (powered by Recharts) visualize revenue and order volume per day
- Summary cards highlight total revenue, bill count, and average order value in that window
- “Jump forward” shortcut advances the selected window for rolling monitoring

### Items Page (`/items`)
- Grid of inventory cards showing image, price, and stock
- `Add New Item` modal captures camera/gallery input, compresses the image ≤1 MB, and stores it as Base64 via the API
- Tapping a card opens an edit modal to rename, change price/stock, update the photo, or delete the item

### Backend API
- `GET /items` – list inventory
- `POST /items` – create item (compresses images on the server)
- `PUT /items/:id` – update metadata or photo
- `DELETE /items/:id` – remove an item
- `GET /bills?date=YYYY-MM-DD` – bills + line items for a day
- `GET /bills?start=YYYY-MM-DD&end=YYYY-MM-DD` – bills within a range (feeds dashboard charts)
- `GET /bills/:id` – single bill with items
- `POST /bills` – create bill, persist bill/items, update stock, allow manual final total
- `PUT /bills/:id` – edit an existing bill (restores previous stock, reapplies new items/totals)
- `DELETE /bills/:id` – delete a bill and restock all of its items

### Database Schema (via `backend/migrations/001_init.sql`)
- `items`: `id`, `name`, `image_base64`, `price`, `stock`, timestamps
- `bills`: `id`, `bill_date`, `total_price`, `final_price`, `created_at`
- `bill_items`: `id`, `bill_id`, `item_id`, `quantity`, `price_per_unit`, `total_price`, `created_at`

## Getting Started

### 1. Prerequisites
- Docker and docker-compose installed

### 2. Environment Variables
- Backend already ships with sensible defaults in `backend/.env.example`
- Docker compose mounts that file automatically, but you can copy it to `.env` if you run the backend outside Docker

### 3. One-Click Startup
```bash
cd /Users/pkhongsawatk/project/storebilling
docker-compose up -d --build
```
Services:
- Frontend: http://localhost:3001
- Backend API: http://localhost:4000
- PostgreSQL: localhost:5432 (`storeadmin` / `storeadminpass` / `storebilling`)
- Optional pgAdmin: http://localhost:5050 (login `admin@local.test` / `admin123`)

The backend container waits for PostgreSQL, runs migrations, and starts the API automatically.

### 4. Seeding Sample Data
```bash
docker compose exec backend npm run seed
```
This clears existing rows and inserts demo items (coffee beans, reusable cup, cookie).

### 5. Running Frontend/Backend Locally (without Docker)
```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run migrate
npm run dev # nodemon

# Frontend
cd frontend
npm install
npm run dev -- --host
```
Frontend expects `VITE_API_URL` (default `http://localhost:4000`) and serves on port 3001.

### 6. Building the Frontend Bundle
```bash
cd frontend
npm run build
```
Artifacts land in `frontend/dist/` and are served by the production Docker image via `serve`.

## Image Handling
- Client compresses any captured/uploaded image to ≤1 MB before sending (max width 1024px)
- Server double-checks/compresses using Sharp and rejects images that cannot be reduced below 1 MB
- Base64 strings persist in PostgreSQL, simplifying retrieval for React image tags

## Testing Checklist
- Create new items and bills from the homepage modal
- Adjust quantities and manual discounts; verify final revenue updates
- Edit/delete inventory entries from `/items`
- Inspect data in pgAdmin or `docker compose exec postgres psql`

## Troubleshooting
- **Containers won’t start**: ensure ports 3001/4000/5432/5050 are free
- **Migrations fail**: remove the `pgdata` volume (`docker volume rm storebilling_pgdata`) and restart
- **Images rejected**: confirm source files are valid images; both frontend and backend enforce the 1 MB limit

Enjoy running your store billing system! If you need enhancements (reports, multi-user auth, exports), you can extend the provided Express routes and React pages.
