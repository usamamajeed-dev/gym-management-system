# Gym Management — Admin Portal

Angular admin portal for the Gym Management System. Admins sign in to approve and manage members, set gym opening hours, and publish events, news and policies for the member app.

## Stack

- Angular 22 (standalone components, signals, zoneless change detection)
- Angular Material 22 (Material 3), themed in `src/styles/_theme.scss`
- Vitest for unit tests, ESLint (`angular-eslint`) and Prettier

## Requirements

- Node.js **22.22.3+** (see `.nvmrc`; run `nvm use`)
- The backend API running at `http://localhost:8000` (see `../backend/README.md`)

## Setup & run

```bash
nvm use
npm install
npm start            # http://localhost:4200
```

Sign in with the seeded admin account from the backend `.env` (default `admin@gym.test` / `Admin@12345`).

The API base URL lives in `src/environments/environment*.ts` (`apiBaseUrl`).

## Quality checks

```bash
npm run lint         # ESLint
npm test             # Vitest unit tests
npm run build        # production build
npm run format       # Prettier (format:check to verify)
```

## Project structure

```
src/app/
  core/
    api/        ApiService (unwraps the response envelope), API models, error interceptor
    auth/       AuthService (signals), guards, auth interceptor, token storage, *appCan directive
    layout/     app shell (sidebar + top bar) and navigation
    ui/         shared UI: confirm dialog, page header, status chip, empty state, loading bar, field error
    utils/      date formatting (gym time) and server-error mapping for forms
  features/     one folder per page (auth/login, dashboard, members, gym-timings, events, event-types, contents)
src/styles/     theme tokens and Material 3 theme
```

## Conventions

- File names: `feature-name.component.ts`, `feature-name.service.ts`, `feature-name.model.ts`.
- Components are standalone and `OnPush`, use signals for state, `inject()` for dependencies and the `@if` / `@for` control flow.
- Routes are lazy-loaded; each feature route is protected by `permissionGuard('<permission>')`, and buttons by `*appCan="'<permission>'"`.
- API errors: 401 signs out and returns to login, 403 / 429 / network / 5xx show a toast, 422 is mapped onto form fields with `applyServerErrors()`.
