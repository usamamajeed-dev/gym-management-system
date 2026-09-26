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
cp .env.example .env            # then set DB_USERNAME / DB_PASSWORD (and APP_DEBUG=true for local dev)
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

`--host=0.0.0.0` lets a phone on the same network reach the API at this machine's LAN IP. Image URLs are built from `APP_URL`, so set it to that LAN address (e.g. `http://192.168.1.20:8000`) when testing the member app on a phone. Mail uses the `log` mailer, so emails are written to `storage/logs/laravel.log`.

## API documentation

Browse the docs at `http://localhost:8000/docs` while the server runs. An OpenAPI spec and a Postman collection are committed in `../docs/api/`.

Regenerate them after changing endpoints:

```bash
php artisan scribe:generate
cp storage/app/private/scribe/openapi.yaml ../docs/api/openapi.yaml
cp storage/app/private/scribe/collection.json ../docs/api/postman-collection.json
```

## Test & code style

```bash
php artisan test                # uses .env.testing → gym_management_test (wiped on each run)
vendor/bin/pint                 # fix style
vendor/bin/pint --test          # check style only
```

## Roles and member approval

| Role | Access |
|---|---|
| `admin` | Admin portal: dashboard, members and approvals, timings, events, news and policies |
| `member` | Member app read endpoints, only while approved and active |

A new registration is `pending` and can't log in. Approving it activates the member and assigns a membership number; rejecting it stores a reason that the member sees when they try to log in. Deactivating a member revokes their tokens, signing them out immediately. Approval and rejection emails are queued, so run `php artisan queue:work`.

## Production deployment

- Set `APP_ENV=production`, `APP_DEBUG=false` and a real `APP_URL` (image URLs are built from it).
- Set `FRONTEND_ADMIN_URL` to the admin portal's origin; CORS allows only that origin outside local.
- Use a real mailer (`MAIL_MAILER=smtp` and credentials) instead of `log`.
- `composer install --no-dev --optimize-autoloader`, then `php artisan migrate --force`, `php artisan config:cache`, `php artisan route:cache`.
- Keep `storage/oauth-*.key` secret and out of version control; generate them once per environment with `php artisan passport:keys`.
- Run `php artisan queue:work` under a process manager (e.g. Supervisor), and add a cron entry: `* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1`. The scheduler archives last month's news every night at 00:10 gym time.
- `php artisan storage:link` so uploaded images are served from `/storage`.

## Configuration

| Key | Purpose |
|---|---|
| `GYM_NAME` | Gym name shown in the apps and emails |
| `GYM_TIMEZONE` | Gym's local timezone (e.g. `Asia/Karachi`). Datetimes are stored in UTC and returned in this zone. |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Seeded admin account |
| `FRONTEND_ADMIN_URL` | Admin portal origin allowed by CORS |
