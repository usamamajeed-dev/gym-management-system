# Gym Management System

A small system for running a gym's membership and member communication:

- Members **register** in the mobile app, and an admin **approves** (or rejects) them in the admin portal.
- Approved members **log in** to see the gym's opening hours, events, news and policies.
- Admins keep that information up to date in the portal: **timings, event types, events, news and policies**. Members see changes the next time they refresh.

## Repository layout

| Folder | What it is | Stack |
|---|---|---|
| [`backend/`](backend/README.md) | REST API for both clients (`/api/v1` for members, `/api/admin` for admins) | Laravel 12, PHP 8.2+, MySQL 8, Passport, spatie/laravel-permission |
| [`admin-portal/`](admin-portal/README.md) | Web portal for gym staff | Angular 22, Angular Material |
| [`mobile-app/`](mobile-app/README.md) | Member app for Android and iOS (also runs in a browser) | Expo (React Native), TanStack Query, React Native Paper |
| `docs/api/` | OpenAPI spec and Postman collection generated from the backend | Scribe |
| `docs/demo/` | Screenshots of the main flow across both apps | |

Each folder has its own README with the full details. The steps below get all three running locally.

## Prerequisites

- **PHP 8.2+** with `pdo_mysql`, `openssl`, `sodium`, `mbstring`, `gd` and `fileinfo`
- **Composer 2**
- **MySQL 8**
- **Node.js 22 LTS** (each JS project has an `.nvmrc`; run `nvm use` inside it)
- **Expo Go** on your phone, or an Android emulator / iOS simulator, for the member app

## Setup

### 1. Backend API

Create two empty MySQL databases, `gym_management` and `gym_management_test`, then:

```bash
cd backend
composer install
cp .env.example .env            # set DB_USERNAME / DB_PASSWORD
cp .env .env.testing            # set APP_ENV=testing and DB_DATABASE=gym_management_test
php artisan key:generate
php artisan migrate --seed
php artisan passport:keys
php artisan passport:client --personal --no-interaction
php artisan storage:link
```

Run it (three terminals):

```bash
php artisan serve --host=0.0.0.0 --port=8000   # the API
php artisan queue:work                         # approval / rejection emails
php artisan schedule:work                      # nightly archiving of old news
```

Emails use the `log` mailer, so they appear in `backend/storage/logs/laravel.log`. API docs are served at <http://localhost:8000/docs>.

### 2. Admin portal

```bash
cd admin-portal
nvm use
npm install
npm start                       # http://localhost:4200
```

### 3. Member app

```bash
cd mobile-app
nvm use
npm install
cp .env.example .env            # set EXPO_PUBLIC_API_URL
npm start                       # scan the QR code with Expo Go
```

On a phone, `localhost` means the phone itself. Set `EXPO_PUBLIC_API_URL` to this computer's LAN address (e.g. `http://192.168.1.20:8000/api/v1`) and set the backend's `APP_URL` to the same host so images load. `npm run web` runs the app in a browser instead.

## Seeded admin account

| Email | Password |
|---|---|
| `admin@gym.test` | `Admin@12345` |

These come from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env`. Change them before deploying anywhere public.

## Try the main flow

1. In the member app, **register** a new account. It lands on the "registration received" screen.
2. In the portal, the dashboard shows **1 pending approval**. Open *Members → Pending* and **approve** the member. They get a membership number and an email (see `laravel.log`).
3. **Log in** to the member app. The home screen shows the membership number, today's opening hours, upcoming events and the latest news.
4. Change a timing, publish an event, news item or policy in the portal, then pull to refresh in the app.

The screenshots in [`docs/demo/`](docs/demo) walk through this flow, plus rejection, deactivation, events and archived news.

## Tests

```bash
cd backend && php artisan test          # feature and unit tests (uses gym_management_test)
cd admin-portal && npm test             # Vitest
cd mobile-app && npm test               # Jest
```

Each project also has lint and format checks, described in its README.
