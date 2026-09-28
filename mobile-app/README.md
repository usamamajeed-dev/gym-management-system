# Gym Management — Member App

React Native (Expo) app for gym members: register, log in once an admin approves the registration, and see the gym's opening hours, this month's events, news and policies, and their profile.

## Stack

- Expo SDK 57 (React Native 0.86, React 19), TypeScript (strict), **expo-router** (file-based routes)
- **TanStack Query** for server state, **axios** for HTTP, **expo-secure-store** for the token
- **react-native-paper** (Material 3) with a custom light/dark theme and the Inter font
- **react-hook-form** + **zod** for forms, **date-fns** + **date-fns-tz** for dates
- Jest (`jest-expo`) + Testing Library, ESLint (`eslint-config-expo`) + Prettier

## Requirements

- Node.js 20.19+ (see `.nvmrc`)
- The backend API running (see `../backend/README.md`)
- The **Expo Go** app on your phone, or an Android emulator / iOS simulator

## Setup & run

```bash
nvm use
npm install
cp .env.example .env   # then set EXPO_PUBLIC_API_URL
npm start              # scan the QR code with Expo Go
```

`EXPO_PUBLIC_API_URL` is the member API base URL, e.g. `http://192.168.1.20:8000/api/v1`. On a phone, `localhost` means the phone itself, so use this computer's **LAN IP** and start the backend with `php artisan serve --host=0.0.0.0`. Set the backend's `APP_URL` to the same host so event and news images load on the phone.

`npm run web` runs the app in a browser (handy for quick checks; the token is kept in `localStorage` there because SecureStore is native-only).

## Quality checks

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # Jest
npm run format      # Prettier (format:check to verify)
```

## Project structure

```
app/                  expo-router screens
  _layout.tsx         providers (Paper, React Query, Auth, safe area), splash, root stack
  (auth)/             login, register, pending — redirect to the tabs when signed in
  (tabs)/             home, events, news, profile — redirect to login when signed out
  timings.tsx, policies.tsx, events/[id].tsx, contents/[id].tsx   pushed screens (signed in only)
src/
  api/                axios client, response types, one file of endpoints per area
  auth/               AuthContext (session state), token storage, React Query client
  hooks/              React Query hooks per screen
  components/         shared UI (Screen, Card, states, banners, cards, rows)
  theme/              colours, spacing, typography, fonts, Paper theme
  utils/              gym-time date formatting, API error mapping
```

## How sessions work

- The token lives in SecureStore and in memory; every request sends `Authorization: Bearer …`.
- On start the app calls `GET /auth/me`; a valid token opens the tabs, otherwise the login screen.
- A `401` from any request (expired or revoked token — deactivating a member revokes their tokens) signs the member out and the login screen explains why. Logging in again shows the specific reason: awaiting approval, rejected (with the admin's reason) or inactive.
