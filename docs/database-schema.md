# Database Schema

MongoDB Atlas — database: `companydb`

---

## Collections

### `users`

Stores all application users (admins, managers, and members).

| Field       | Type      | Required | Unique | Notes                                  |
|-------------|-----------|----------|--------|----------------------------------------|
| `_id`       | ObjectId  | auto     | ✓      | MongoDB document ID                    |
| `name`      | String    | ✓        |        | Trimmed                                |
| `email`     | String    | ✓        | ✓      | Lowercase, trimmed                     |
| `number`    | Number    |          | ✓      | Sparse index (optional, unique)        |
| `phone`     | String    |          |        | Trimmed                                |
| `password`  | String    | ✓        |        | bcrypt hash (12 rounds) — never exposed|
| `role`      | String    | ✓        |        | Enum: `admin` \| `manager` \| `member`  |
| `status`    | Boolean   |          |        | Default: `true` (active)               |
| `createdAt` | Date      | auto     |        | Mongoose timestamp                     |
| `updatedAt` | Date      | auto     |        | Mongoose timestamp                     |

**Indexes:**
- `email` — unique
- `number` — unique, sparse

**Example document:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Alice Smith",
  "email": "alice@example.com",
  "number": 1001,
  "phone": "555-0100",
  "password": "$2a$12$...",
  "role": "admin",
  "status": true,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

---

### `refreshtokens`

Stores active refresh tokens for JWT rotation. Expired tokens are auto-deleted by MongoDB TTL index.

| Field       | Type      | Required | Notes                             |
|-------------|-----------|----------|-----------------------------------|
| `_id`       | ObjectId  | auto     | MongoDB document ID               |
| `userId`    | ObjectId  | ✓        | Ref: `users._id`                  |
| `token`     | String    | ✓        | Signed JWT refresh token          |
| `expiresAt` | Date      | ✓        | TTL index auto-deletes at expiry  |

**Indexes:**
- `expiresAt` — TTL (`expireAfterSeconds: 0`) — auto-deletes expired tokens
- `token` — regular index for fast lookup

**Example document:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "expiresAt": "2024-01-22T10:00:00.000Z"
}
```

---

### `auditlogs`

Immutable log of all significant actions in the system. Admin-only access.

| Field       | Type      | Required | Notes                                                      |
|-------------|-----------|----------|------------------------------------------------------------|
| `_id`       | ObjectId  | auto     | MongoDB document ID                                        |
| `userId`    | ObjectId  | ✓        | Ref: `users._id` — who performed the action               |
| `action`    | String    | ✓        | Enum — see action types below                              |
| `resource`  | String    | ✓        | e.g. `user:abc123`, `member:xyz789`                        |
| `timestamp` | Date      |          | Default: `Date.now()`                                      |

**Action types:**
| Action          | Triggered by                  |
|-----------------|-------------------------------|
| `REGISTER`      | New user registration         |
| `LOGIN`         | Successful login              |
| `LOGOUT`        | User logout                   |
| `CREATE_MEMBER` | Admin/manager creates member  |
| `UPDATE_MEMBER` | Admin/manager updates member  |
| `DELETE_MEMBER` | Admin deletes member          |

**Indexes:**
- `timestamp` — descending, for fast pagination of recent logs
- `userId` — for user-specific log queries

**Example document:**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "userId": "507f1f77bcf86cd799439011",
  "action": "CREATE_MEMBER",
  "resource": "member:507f1f77bcf86cd799439014",
  "timestamp": "2024-01-15T10:05:00.000Z"
}
```

---

## Entity Relationships

```
users (1) ──────────── (many) refreshtokens
  │                             userId → users._id
  │
  └──────────────────── (many) auditlogs
                                userId → users._id
```

---

## Notes

- Passwords are **never** returned in API responses. The `select("-password")` projection is applied on every user query.
- The `refreshtokens` collection is self-cleaning via MongoDB's TTL index — no cron job needed.
- The `auditlogs` collection is append-only. No update or delete endpoints exist for it.
