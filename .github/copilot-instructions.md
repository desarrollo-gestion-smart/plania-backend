# Plania Backend - AI Coding Agent Instructions

## Architecture Overview

**Plania** is an Express.js backend for a business management platform with **multi-tenancy by businessId**. The stack: Node.js + Express + Firebase (Firestore + Storage) + JWT auth + SMS integration.

### Core Flow
1. **User/Business Auth** → JWT token generation via Firebase & custom JWT service
2. **Business-scoped Operations** → All data queries filtered by `businessId` 
3. **Role-based Access** → "user" | "business" | "staff" roles enforced in middleware
4. **Service Layer** → Firestore operations centralized in [firestoreService.js](src/services/firestoreService.js) (2900+ lines)

## Key Patterns & Conventions

### Controller Pattern (Request/Response)
Controllers validate inputs, call services, and handle errors with appropriate HTTP codes:
```javascript
// Example: src/controllers/expensesController.js
export const createExpenseController = async (req, res) => {
  try {
    const { businessId, name, categoryId, paidAt, amount } = req.body || {};
    if (!businessId || !name || categoryId === undefined...) {
      return res.status(400).json({ error: "Campos requeridos: ..." });
    }
    const expense = await createExpense({ businessId, name, categoryId, paidAt, amount });
    return res.status(201).json({ expense });
  } catch (error) {
    const code = /inválido|not found|requeridos/.test(error?.message) ? 400 : 500;
    return res.status(code).json({ error: error?.message });
  }
};
```

- **Error mapping**: Regex match error messages to determine 400 vs 500
- **Validations**: Explicit null/undefined checks; special handling for `categoryId === undefined`
- **Response format**: `{ fieldName: data }` or `{ error: message }`

### Firestore Patterns
- **Auto-increment IDs**: `getNextId()` via Firestore transactions on "counters" collection
- **Hashing**: Verification codes hashed with SHA-256 before storage
- **Timestamps**: Use `admin.firestore.FieldValue.serverTimestamp()` for consistency
- **Filtering**: All queries filtered by `businessId` (tenant isolation)
- **Undefined props**: Firebase config sets `ignoreUndefinedProperties: true` to skip null values

### Authentication & Authorization
**Middleware stack** ([auth.js](src/middleware/auth.js)):
1. `authenticateToken`: Extracts JWT from `Authorization: Bearer <token>` or query param `access_token`
2. Checks `revokedTokens` collection for token invalidation
3. Attaches `req.user = { userId, role, iat, exp, jti }` for downstream use
4. `authorizeRoles(...roles)`: Verifies `req.user.role` after authentication

```javascript
router.get("/appointments/:businessId", authenticateToken, authorizeRoles("business", "staff"), handler);
```

### Routes Organization
Each entity has dedicated route file: `appointmentsRoutes.js`, `expensesRoutes.js`, etc.
- All mounted in [index.ts](src/index.ts) via `app.use(uploadRoutes)` pattern
- Swagger docs via [swagger.js](src/config/swagger.js)

### Environment & Configuration
- **Firebase**: Credentials from `firebase-service-account.json` (git-ignored)
- **CORS**: Configured for Expo web (`localhost:19006`) + local network IPs
- **SMS**: Integration via external API (ejesatelital.com) - see [smsService.js](src/services/smsService.js)
- **Env vars**: `CORS_ORIGINS`, `FIREBASE_STORAGE_BUCKET`, AWS credentials, SMS auth

## Development Workflow

### Setup & Running
```bash
pnpm install                # Install dependencies
npm run dev                 # Watch mode: tsx watch src/index.ts
npm run build              # Compile TypeScript → dist/
npm start                  # Run compiled dist/index.js
```

### Adding New Features
1. **Define controller** → [controllers/](src/controllers/) with pattern above
2. **Implement Firestore service** → Add export to [firestoreService.js](src/services/firestoreService.js)
3. **Create routes** → [routes/](src/routes/) with auth middleware
4. **Mount in index.ts** → Add `app.use(yourRoutes)`
5. **Add Swagger docs** → JSDoc comments in route definitions

### Common Tasks
- **Database queries**: Always prefix with `businessId` filter (multi-tenancy)
- **Error handling**: Use try/catch; map error messages to HTTP status codes
- **Timestamps**: Use `admin.firestore.FieldValue.serverTimestamp()`
- **JWT tokens**: Generated/verified via [jwt.js](src/utils/jwt.js) util

## Language Mix & File Conventions
- **TypeScript** ([.ts](src/)): Config files, entry point
- **JavaScript** ([.js](src/controllers/)): Controllers, services, routes (pre-transpiled with `// @ts-ignore`)
- **No tests yet**: Test setup not configured (`"test": "echo Error"`)

## Integration Points
- **Firebase Admin SDK**: App initialization, Firestore reads/writes, Cloud Storage uploads
- **JWT**: Custom tokens stored in Firestore `tokens` collection, revocation via `revokedTokens`
- **SMS Service**: External API for sending verification/appointment notifications
- **Multer**: File upload middleware for avatar/document uploads
- **Swagger/OpenAPI**: Auto-generated API docs at `/api-docs`

## When to Ask for Clarification
- **Multi-tenancy boundaries**: Confirm `businessId` scoping in new queries
- **Role-based access**: Verify which roles can perform an operation
- **External API rates**: SMS service quotas or Firebase quota issues
- **TypeScript vs JS**: New files should use `.ts` for consistency; note JS files have `// @ts-ignore`
