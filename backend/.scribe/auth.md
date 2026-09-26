# Authenticating requests

To authenticate requests, include an **`Authorization`** header with the value **`"Bearer {TOKEN}"`**.

All authenticated endpoints are marked with a `requires authentication` badge in the documentation below.

Get a token from <code>POST /api/v1/auth/login</code> (members) or <code>POST /api/admin/auth/login</code> (admins).
