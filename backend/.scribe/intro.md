# Introduction

Backend API for the Gym Management System: the member app (/api/v1) and the admin portal (/api/admin).

<aside>
    <strong>Base URL</strong>: <code>http://localhost:8000</code>
</aside>

    Two clients share this API:

    - **Member app** — base path `/api/v1`. Members register, log in once an admin approves them, and read gym information.
    - **Admin portal** — base path `/api/admin`. Admins manage members, timings, events, news and policies.

    **Authentication.** Log in with `POST /api/v1/auth/login` (members) or `POST /api/admin/auth/login` (admins) and send the returned token as `Authorization: Bearer <token>`. Always send `Accept: application/json`.

    **Responses.** Success: `{ "success": true, "message": "...", "data": ... }`. Paginated lists put `{ "list": [...], "pagination": { "total", "count", "per_page", "current_page", "total_pages" } }` in `data`. Errors: `{ "success": false, "message": "...", "errors"?: {...}, "error_code"?: "..." }`.

    **Dates.** ISO-8601 with offset in the gym's timezone (e.g. `2026-10-01T18:00:00+05:00`). Opening times are `"HH:mm"`.

    **Admin lists** accept `search`, `column` + `dir` (allow-listed sort), `length` (default 10, max 100) and `page`.

