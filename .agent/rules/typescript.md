---
trigger: always_on
---

# TypeScript & Node.js Rules

## 1. Node.js Project Structure
```
src/
├── controllers/
├── services/
├── repositories/
├── middleware/
├── types/
└── utils/
```

## 2. Standards
- ✅ **Strict TypeScript:** No `any` without justification.
- ✅ **Environment Validation:** Use Zod/Joi.
  ```typescript
  const envSchema = z.object({
    PORT: z.string().transform(Number),
    DATABASE_URL: z.string().url(),
  });
  export const env = envSchema.parse(process.env);
  ```
- ✅ **Error Handling Middleware:** Centralized error handling.

## 3. Type Safety Examples
- ❌ **Bad:** `function process(data: any)`
- ✅ **Good:** Define Interfaces/Types.
  ```typescript
  interface User {
    id: string;
    name: string;
    role: 'admin' | 'user';
  }
  ```
- 🟢 **Acceptable:** Use `unknown` with type guards if necessary.

## 4. Async/Await Error Handling
- Always use `try/catch` for async operations (DB, API).
- Handle Promise rejections.