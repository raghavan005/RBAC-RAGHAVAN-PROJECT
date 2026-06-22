# Audit Logs

The audit log system automatically records every significant action in the application. Logs are stored in the `auditlogs` MongoDB collection and are viewable by admins only.

---

## How It Works

Audit log entries are created silently alongside the primary operation. If the log write fails, the main operation still succeeds — logs never break functionality.

```
User Action → Controller → Service (primary operation) → createAuditLog() → AuditLog.create()
                                ↓
                          Response sent to client
```

The `createAuditLog()` utility (`backend/src/utils/auditLog.ts`) wraps the DB write in a try/catch so failures are only logged to the server console.

---

## Tracked Actions

| Action          | Triggered when                          | Resource format         |
|-----------------|-----------------------------------------|-------------------------|
| `REGISTER`      | A new user registers                    | `user:<userId>`         |
| `LOGIN`         | A user logs in successfully             | `user:<userId>`         |
| `LOGOUT`        | A user logs out                         | `user:<userId>`         |
| `CREATE_MEMBER` | Admin or manager creates a new member   | `member:<memberId>`     |
| `UPDATE_MEMBER` | Admin or manager updates a member       | `member:<memberId>`     |
| `DELETE_MEMBER` | Admin deletes a member                  | `member:<memberId>`     |

---

## Viewing Audit Logs

### In the Application

1. Log in as an **admin** user.
2. Click **Audit Logs** in the navigation bar.
3. Logs are displayed in reverse chronological order (newest first).
4. Use the Previous/Next buttons to paginate through entries.

The table shows:
- **User** — name and email of the actor
- **Action** — color-coded action badge
- **Resource** — the resource that was affected
- **Timestamp** — local date and time

### Via the API

```bash
GET /api/audit-logs?page=1&limit=20
Authorization: Bearer <admin-access-token>
```

Response:
```json
{
  "logs": [
    {
      "_id": "...",
      "userId": { "name": "Alice", "email": "alice@example.com", "role": "admin" },
      "action": "DELETE_MEMBER",
      "resource": "member:507f1f77bcf86cd799439014",
      "timestamp": "2024-01-15T10:05:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

---

## Schema Reference

See [database-schema.md](database-schema.md#auditlogs) for the full MongoDB schema.

---

## Adding New Audit Events

To track a new action:

1. Add the action name to the `AuditAction` union type in `backend/src/models/AuditLog.ts`:
   ```typescript
   export type AuditAction = "LOGIN" | "LOGOUT" | ... | "YOUR_NEW_ACTION";
   ```

2. Also add it to the Mongoose schema enum array in the same file.

3. Call `createAuditLog()` in the relevant controller:
   ```typescript
   import { createAuditLog } from "../utils/auditLog";

   await createAuditLog(req.user!.userId, "YOUR_NEW_ACTION", `resource:${id}`);
   ```

The log entry will appear in the admin Audit Logs page automatically.
