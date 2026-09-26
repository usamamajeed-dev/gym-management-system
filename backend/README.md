# Gym Management — Backend API

Laravel 12 API for the Gym Management System. It serves two clients:

| Client | Base URL |
|---|---|
| Member app (React Native) | `/api/v1` |
| Admin portal (Angular) | `/api/admin` |

Stack: PHP 8.2+, MySQL 8, Laravel Passport 13 (tokens), spatie/laravel-permission 6 (roles & permissions), Scribe (API docs), Pint (code style).

## Requirements

- PHP 8.2+ with `pdo_mysql`, `openssl`, `sodium`, `mbstring`, `gd`, `fileinfo`
- Composer 2
- MySQL 8 with two empty databases: `gym_management` and `gym_management_test`

## Setup

```bash
composer install
cp .env.example .env            # then set DB_USERNAME / DB_PASSWORD
cp .env .env.testing            # then set APP_ENV=testing, DB_DATABASE=gym_management_test
php artisan key:generate

php artisan migrate --seed      # tables, roles & permissions, admin user, gym timings
php artisan passport:keys       # OAuth signing keys (storage/oauth-*.key)
php artisan passport:client --personal --no-interaction
php artisan storage:link        # serves uploaded images from public/storage
```

The seeded admin logs in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` (default `admin@gym.test` / `Admin@12345`).

## Run

```bash
php artisan serve --host=0.0.0.0 --port=8000   # API on http://localhost:8000
php artisan queue:work                         # sends queued notification emails
php artisan schedule:work                      # nightly news auto-archive
```

`--host=0.0.0.0` lets a phone on the same network reach the API at this machine's LAN IP. Mail uses the `log` mailer, so emails are written to `storage/logs/laravel.log`.

## Test & code style

```bash
php artisan test                # uses .env.testing → gym_management_test (wiped on each run)
vendor/bin/pint                 # fix style
vendor/bin/pint --test          # check style only
```

## Configuration

| Key | Purpose |
|---|---|
| `GYM_NAME` | Gym name shown in the apps and emails |
| `GYM_TIMEZONE` | Gym's local timezone (e.g. `Asia/Karachi`). Datetimes are stored in UTC and returned in this zone. |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Seeded admin account |
| `FRONTEND_ADMIN_URL` | Admin portal origin allowed by CORS |
