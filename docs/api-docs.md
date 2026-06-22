# API Documentation

Base URL: `http://localhost:5000/api`

Interactive Swagger UI: `http://localhost:5000/api/docs`

All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

---

## Authentication

### POST `/auth/register`

Register a new user account.

**Request body:**
```json
{
  "name": "Alice Smith",       // required
  "email": "alice@example.com",// required
  "password": "secret123",     // required, min 6 chars
  "role": "member",            // optional: admin | manager | member (default: member)
  "phone": "555-0100",         // optional
  "number": 1001               // optional, must be unique
}
```

**Response `201`:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Alice Smith",
    "email": "alice@example.com",
    "role": "member",
    "status": true
  }
}
```
Sets `refreshToken` httpOnly cookie (7 days).

**Errors:** `400` validation | `409` email already registered

---

### POST `/auth/login`

Login with email and password.

**Request body:**
```json
{
  "email": "alice@example.com",
  "password": "secret123"
}
```

**Response `200`:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Alice Smith",
    "email": "alice@example.com",
    "role": "member",
    "status": true
  }
}
```
Sets `refreshToken` httpOnly cookie (7 days).

**Errors:** `400` validation | `401` invalid credentials

---

### POST `/auth/refresh`

Get a new access token using the refresh token cookie. Old refresh token is rotated (deleted and replaced).

**Requires:** `refreshToken` cookie (set automatically on login/register)

**Response `200`:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```
Sets new `refreshToken` cookie.

**Errors:** `401` no/invalid/expired refresh token

---

### POST `/auth/logout`

🔒 Requires: Bearer token

Invalidates the refresh token and clears the cookie.

**Response `200`:**
```json
{ "message": "Logged out" }
```

---

### GET `/auth/profile`

🔒 Requires: Bearer token

Get the currently authenticated user's profile.

**Response `200`:**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Alice Smith",
    "email": "alice@example.com",
    "phone": "555-0100",
    "role": "admin",
    "status": true,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Errors:** `401` unauthorized | `404` user not found

---

## Members

### GET `/members`

🔒 Requires: Bearer token | Permission: `view-members` (all roles)

List members with pagination, search, and sorting.

**Query parameters:**

| Param       | Type    | Default    | Description                          |
|-------------|---------|------------|--------------------------------------|
| `page`      | number  | `1`        | Page number                          |
| `limit`     | number  | `10`       | Results per page (max 50)            |
| `search`    | string  | —          | Filter by name or email              |
| `sortBy`    | string  | `createdAt`| Sort field: `createdAt`,`name`,`email`|
| `sortOrder` | string  | `desc`     | `asc` or `desc`                      |

**Response `200`:**
```json
{
  "members": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Alice Smith",
      "email": "alice@example.com",
      "role": "admin",
      "status": true,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

---

### GET `/members/:id`

🔒 Requires: Bearer token | Permission: `view-members` (all roles)

**Response `200`:**
```json
{
  "member": { "_id": "...", "name": "...", "email": "...", "role": "member", "status": true }
}
```

**Errors:** `401` | `403` | `404` not found

---

### POST `/members`

🔒 Requires: Bearer token | Permission: `create-member` (admin, manager)

**Request body:**
```json
{
  "name": "Bob Jones",         // required
  "email": "bob@example.com",  // required
  "password": "secure123",     // required, min 6 chars
  "phone": "555-0200",         // optional
  "role": "member",            // optional, default: member
  "status": true               // optional, default: true
}
```

**Response `201`:**
```json
{
  "member": { "_id": "...", "name": "Bob Jones", "email": "bob@example.com", "role": "member" }
}
```

**Errors:** `400` validation | `401` | `403` | `409` email exists

---

### PUT `/members/:id`

🔒 Requires: Bearer token | Permission: `edit-member` (admin, manager)

All fields are optional. Password is re-hashed if provided.

**Request body:**
```json
{
  "name": "Bob Updated",
  "phone": "555-0999",
  "role": "manager",
  "status": false
}
```

**Response `200`:**
```json
{
  "member": { "_id": "...", "name": "Bob Updated", "role": "manager", "status": false }
}
```

**Errors:** `400` | `401` | `403` | `404`

---

### DELETE `/members/:id`

🔒 Requires: Bearer token | Permission: `delete-member` (admin only)

**Response `200`:**
```json
{ "message": "Member deleted" }
```

**Errors:** `401` | `403` | `404`

---

## Audit Logs

### GET `/audit-logs`

🔒 Requires: Bearer token | Permission: `view-audit-logs` (admin only)

**Query parameters:**

| Param   | Type   | Default | Description               |
|---------|--------|---------|---------------------------|
| `page`  | number | `1`     | Page number               |
| `limit` | number | `20`    | Results per page (max 100)|

**Response `200`:**
```json
{
  "logs": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "userId": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Alice Smith",
        "email": "alice@example.com",
        "role": "admin"
      },
      "action": "CREATE_MEMBER",
      "resource": "member:507f1f77bcf86cd799439014",
      "timestamp": "2024-01-15T10:05:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 87,
    "totalPages": 5
  }
}
```

**Errors:** `401` | `403` admin only

---

## Error Response Format

All errors return consistent JSON:

```json
{ "error": "Human-readable error message" }
```

Validation errors also include a `details` array:

```json
{
  "error": "Invalid email address",
  "details": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

## HTTP Status Codes

| Code | Meaning                          |
|------|----------------------------------|
| 200  | OK                               |
| 201  | Created                          |
| 400  | Bad Request / Validation error   |
| 401  | Unauthorized (missing/bad token) |
| 403  | Forbidden (insufficient role)    |
| 404  | Resource not found               |
| 409  | Conflict (duplicate email, etc.) |
| 429  | Too many requests (rate limited) |
| 500  | Internal server error            |
