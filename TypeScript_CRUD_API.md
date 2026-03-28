# TypeScript CRUD API with Node.js, Express & MySQL

> **Tools Needed:** Node.js, MySQL, VS Code, Postman (or curl, VS Code extensions like Postman, ThunderClient, or EchoAPI)

---

## 💬 Quick Discussion: Why TypeScript?

> **Student:** "We've been using JavaScript this whole time. Why switch to TypeScript now?"
>
> **Instructor:** "Great question! TypeScript adds type safety to your code. Instead of guessing if a variable is a string or number, TypeScript tells you at compile time. This catches bugs early, improves code documentation, and makes working in teams much smoother. Think of it as JavaScript with superpowers!"

---

## What You'll Learn

By the end of this activity, you will be able to:

- ✅ Set up a TypeScript project with Node.js and Express
- ✅ Define interfaces and types for your API models
- ✅ Build a CRUD API with MySQL using Sequelize and TypeScript
- ✅ Implement JWT authentication with typed middleware
- ✅ Test your API endpoints using Postman or curl
- ✅ Understand the TypeScript compilation workflow

---

## ✅ Prerequisites Checklist

Before you start, make sure you can:

- [ ] Run basic Express routes in JavaScript
- [ ] Use `npm` to install packages
- [ ] Write simple SQL queries or understand database concepts
- [ ] Use Postman or curl to test HTTP endpoints

> 🔔 Don't worry if you're new to TypeScript! We'll walk through the setup together.

---

## 💬 Discussion: API-First Development

> **Student:** "Why are we removing the front end for this activity?"
>
> **Instructor:** "Because APIs are the backbone of modern applications. Whether your frontend is React, Angular, mobile, or even another backend service, they all talk to your API. By focusing on the API first, you learn to build reliable, well-documented endpoints that any client can consume. Plus, testing APIs directly helps you debug faster!"

---

## 🧩 What We're Building

A TypeScript-based REST API that manages user records with:

| Feature | Description |
|---|---|
| 🔐 Authentication | JWT-based login/register with bcrypt password hashing |
| 👥 Role-Based Access | `Admin` and `User` roles with server-side enforcement |
| 🗄️ Database | MySQL with Sequelize ORM + TypeScript models |
| ✏️ Testing | Test all endpoints with Postman/curl (no frontend needed) |
| 🧱 Structure | Clean, typed, feature-based architecture |

🎯 **Final Result:** A fully typed, tested CRUD API ready for any frontend to consume.

---

## 🗂 Project Structure (TypeScript Edition)

```
typescript-crud-api/
├── config.json              # Database credentials
├── tsconfig.json            # TypeScript compiler settings ⭐ NEW
├── package.json
│
├── src/
│   ├── server.ts            # Entry point (was server.js) ⭐ NEW
│   │
│   ├── _helpers/
│   │   ├── db.ts            # MySQL + Sequelize setup ⭐ NEW
│   │   └── role.ts          # Role enum (now typed!) ⭐ NEW
│   │
│   ├── _middleware/
│   │   ├── errorHandler.ts  # Global error handler ⭐ NEW
│   │   └── validateRequest.ts # Joi validation wrapper ⭐ NEW
│   │
│   └── users/
│       ├── user.model.ts    # Sequelize User model (typed) ⭐ NEW
│       ├── user.service.ts  # Business logic (typed methods) ⭐ NEW
│       └── users.controller.ts # Route handlers (typed) ⭐ NEW
│
└── tests/                   # ⭐ NEW: API test scripts
    └── users.test.ts        # Example: test CRUD endpoints
```

> 💡 **Key Change:** All `.js` files become `.ts`, and we add `tsconfig.json` to configure the TypeScript compiler.

---

## 💬 Discussion: TypeScript vs. JavaScript Compilation

> **Student:** "Do I need to compile TypeScript every time I make a change?"
>
> **Instructor:** "Good catch! During development, we use `ts-node` or `nodemon` + `ts-node` to run TypeScript directly without manual compilation. For production, we compile to JavaScript using `tsc`. We'll set up both workflows so you can focus on coding, not compiling!"

---

## 🚀 Step-by-Step Implementation

### 🔹 Step 1: Initialize TypeScript Project

```bash
# 1. Create project folder
mkdir typescript-crud-api
cd typescript-crud-api

# 2. Initialize Node.js project
npm init -y

# 3. Install runtime dependencies
npm install express mysql2 sequelize bcryptjs jsonwebtoken cors joi rootpath

# 4. Install TypeScript + dev dependencies
npm install --save-dev typescript ts-node @types/node @types/express @types/cors @types/bcryptjs @types/jsonwebtoken nodemon

# 5. Generate tsconfig.json
npx tsc --init
```

✅ **What this does:** Sets up TypeScript with sensible defaults for Node.js development.

---

### 🔹 Step 2: Configure TypeScript (`tsconfig.json`)

Update your `tsconfig.json` to:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "baseUrl": "./src",
    "paths": {
      "_helpers/*": ["_helpers/*"],
      "_middleware/*": ["_middleware/*"],
      "users/*": ["users/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

✅ **Key settings explained:**
- `strict: true` → Enables full type checking (catches more bugs!)
- `baseUrl` + `paths` → Allows clean imports like `import { db } from '_helpers/db'`
- `resolveJsonModule: true` → Lets you import `config.json` directly

---

### 🔹 Step 3: Update `package.json` Scripts

```json
"scripts": {
  "build": "tsc",
  "start": "node dist/server.js",
  "start:dev": "nodemon --exec ts-node src/server.ts",
  "test": "ts-node tests/users.test.ts"
}
```

✅ Now you can:
- `npm run start:dev` → Run with auto-reload during development
- `npm run build` → Compile to JavaScript for production
- `npm run test` → Run API tests

---

## 💬 Discussion: Why `ts-node`?

> **Student:** "What does `ts-node` actually do?"
>
> **Instructor:** "`ts-node` is a TypeScript execution engine. It compiles your `.ts` files in memory and runs them with Node.js — no manual `tsc` step needed during development. It's like having a translator that works in real-time!"

---

### 🔹 Step 4: Configure Database (`config.json`)

Create `config.json` in project root:

```json
{
  "database": {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "",
    "database": "typescript_crud_api"
  },
  "jwtSecret": "change-this-in-production-123!"
}
```

> ⚠️ **Security Note:** In production, use environment variables (`process.env.JWT_SECRET`) instead of hardcoding secrets.

---

### 🔹 Step 5: Database Helper (`src/_helpers/db.ts`)

```typescript
// src/_helpers/db.ts
import config from '../../config.json';
import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';

export interface Database {
  User: any; // We'll type this properly after creating the model
}

export const db: Database = {} as Database;

export async function initialize(): Promise<void> {
  const { host, port, user, password, database } = config.database;

  // Create database if it doesn't exist
  const connection = await mysql.createConnection({ host, port, user, password });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
  await connection.end();

  // Connect to database with Sequelize
  const sequelize = new Sequelize(database, user, password, { dialect: 'mysql' });

  // Initialize models
  const { default: userModel } = await import('../users/user.model');
  db.User = userModel(sequelize);

  // Sync models with database
  await sequelize.sync({ alter: true });

  console.log('✅ Database initialized and models synced');
}
```

✅ **TypeScript highlights:**
- `export interface Database` → Defines the shape of our db object
- `Promise<void>` → Explicit return type for async function
- `as Database` → Type assertion for initial empty object

---

### 🔹 Step 6: Role Enum (`src/_helpers/role.ts`)

```typescript
// src/_helpers/role.ts
export enum Role {
  Admin = 'Admin',
  User = 'User'
}
```

✅ **Why an enum?**
Instead of magic strings like `'Admin'`, we use `Role.Admin`. TypeScript will catch typos at compile time!

---

## 💬 Discussion: Enums vs. String Literals

> **Student:** "Could we just use string literals instead of an enum?"
>
> **Instructor:** "Yes, but enums give you autocomplete and refactoring safety. If you rename `Role.Admin` to `Role.SuperAdmin`, TypeScript updates all references. With strings, you'd have to search-and-replace — and risk missing one!"

---

### 🔹 Step 7: User Model (`src/users/user.model.ts`)

```typescript
// src/users/user.model.ts
import { DataTypes, Model, Optional } from 'sequelize';
import type { Sequelize } from 'sequelize';

// Define the attributes interface
export interface UserAttributes {
  id: number;
  email: string;
  passwordHash: string;
  title: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: Date;   // ✅ ADD THIS
  updatedAt: Date;   // ✅ ADD THIS
}

// Define optional attributes for creation
export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Define the Sequelize model class
export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {

  public id!: number;
  public email!: string;
  public passwordHash!: string;
  public title!: string;
  public firstName!: string;
  public lastName!: string;
  public role!: string;
  public readonly createdAt!: Date;   // ✅ ADD THIS
  public readonly updatedAt!: Date;   // ✅ ADD THIS
}

// Export the model initializer function
export default function (sequelize: Sequelize): typeof User {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,  // ✅ Ensure this is true (default)
      defaultScope: {
        attributes: { exclude: ['passwordHash'] },
      },
      scopes: {
        withHash: {
          attributes: { include: ['passwordHash'] },
        },
      },
    }
  );

  return User;
}
```

✅ **TypeScript power moves:**
- `UserAttributes` interface → Defines the exact shape of a user object
- `Optional<UserAttributes, ...>` → Marks fields that aren't required on creation
- `typeof User` → Returns the model class type, not an instance

---

### 🔹 Step 8: User Service (`src/users/user.service.ts`)

```typescript
// src/users/user.service.ts
import bcrypt from 'bcryptjs';
import { db } from '../_helpers/db';
import { Role } from '../_helpers/role';
import { User, UserCreationAttributes } from './user.model';

export const userService = {
  getAll,
  getById,
  create,
  update,
  delete: _delete,
};

async function getAll(): Promise<User[]> {
  return await db.User.findAll();
}

async function getById(id: number): Promise<User> {
  return await getUser(id);
}

async function create(params: UserCreationAttributes & { password: string }): Promise<void> {
  // Check if email already exists
  const existingUser = await db.User.findOne({ where: { email: params.email } });
  if (existingUser) {
    throw new Error(`Email "${params.email}" is already registered`);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(params.password, 10);

  // Create user (exclude password from saved fields)
  await db.User.create({
    ...params,
    passwordHash,
    role: params.role || Role.User, // Default to User role
  } as UserCreationAttributes);
}

async function update(id: number, params: Partial<UserCreationAttributes> & { password?: string }): Promise<void> {
  const user = await getUser(id);

  // Hash new password if provided
  if (params.password) {
    params.passwordHash = await bcrypt.hash(params.password, 10);
    delete params.password; // Remove plain password
  }

  // Update user
  await user.update(params as Partial<UserCreationAttributes>);
}

async function _delete(id: number): Promise<void> {
  const user = await getUser(id);
  await user.destroy();
}

// Helper: Get user or throw error
async function getUser(id: number): Promise<User> {
  const user = await db.User.scope('withHash').findByPk(id);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}
```

✅ **TypeScript benefits:**
- `Promise<User[]>` → Clear return type for async functions
- `Partial<UserCreationAttributes>` → Allows updating only some fields
- Type assertions (`as UserCreationAttributes`) → Safe casting when needed

---

## 💬 Discussion: Error Handling in TypeScript

> **Student:** "Why are we using `throw new Error()` instead of just `throw 'string'`?"
>
> **Instructor:** "Great observation! In JavaScript, you can throw anything — even strings. But in TypeScript with `strict` mode, it's best practice to throw `Error` objects. They include stack traces, are easier to debug, and work better with typed error handlers. Plus, our global error handler can check `err instanceof Error`!"

---

### 🔹 Step 9: Middleware (`src/_middleware/`)

#### Global Error Handler (`errorHandler.ts`)

```typescript
// src/_middleware/errorHandler.ts
import type { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error | string,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void {
  if (typeof err === 'string') {
    // Custom application error
    const is404 = err.toLowerCase().endsWith('not found');
    const statusCode = is404 ? 404 : 400;
    return res.status(statusCode).json({ message: err });
  }

  if (err instanceof Error) {
    // Standard Error object
    return res.status(500).json({ message: err.message });
  }

  // Fallback
  return res.status(500).json({ message: 'Internal server error' });
}
```

#### Request Validator (`validateRequest.ts`)

```typescript
// src/_middleware/validateRequest.ts
import type { Request, NextFunction } from 'express';
import Joi from 'joi';

export function validateRequest(
  req: Request,
  next: NextFunction,
  schema: Joi.ObjectSchema
): void {
  const options = {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  };

  const { error, value } = schema.validate(req.body, options);

  if (error) {
    next(`Validation error: ${error.details.map((d) => d.message).join(', ')}`);
  } else {
    req.body = value;
    next();
  }
}
```

✅ **TypeScript types used:**
- `Request, Response, NextFunction` → Express built-in types
- `Joi.ObjectSchema` → Type from Joi library

---

### 🔹 Step 10: Users Controller (`src/users/users.controller.ts`)

```typescript
// src/users/users.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import Joi from 'joi';
import { Role } from '../_helpers/role';
import { validateRequest } from '../_middleware/validateRequest';
import { userService } from './user.service';

const router = Router();

// 🔶 ROUTES
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', createSchema, create);
router.put('/:id', updateSchema, update);
router.delete('/:id', _delete);

export default router;

// 🔶 ROUTE HANDLERS (typed)
function getAll(req: Request, res: Response, next: NextFunction): void {
  userService.getAll()
    .then((users) => res.json(users))
    .catch(next);
}

function getById(req: Request, res: Response, next: NextFunction): void {
  userService.getById(Number(req.params.id))
    .then((user) => res.json(user))
    .catch(next);
}

function create(req: Request, res: Response, next: NextFunction): void {
  userService.create(req.body)
    .then(() => res.json({ message: 'User created' }))
    .catch(next);
}

function update(req: Request, res: Response, next: NextFunction): void {
  userService.update(Number(req.params.id), req.body)
    .then(() => res.json({ message: 'User updated' }))
    .catch(next);
}

function _delete(req: Request, res: Response, next: NextFunction): void {
  userService.delete(Number(req.params.id))
    .then(() => res.json({ message: 'User deleted' }))
    .catch(next);
}

// 🔶 VALIDATION SCHEMAS
function createSchema(req: Request, res: Response, next: NextFunction): void {
  const schema = Joi.object({
    title: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    role: Joi.string().valid(Role.Admin, Role.User).default(Role.User),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  });
  validateRequest(req, next, schema);
}

function updateSchema(req: Request, res: Response, next: NextFunction): void {
  const schema = Joi.object({
    title: Joi.string().empty(''),
    firstName: Joi.string().empty(''),
    lastName: Joi.string().empty(''),
    role: Joi.string().valid(Role.Admin, Role.User).empty(''),
    email: Joi.string().email().empty(''),
    password: Joi.string().min(6).empty(''),
    confirmPassword: Joi.string().valid(Joi.ref('password')).empty(''),
  }).with('password', 'confirmPassword');
  validateRequest(req, next, schema);
}
```

✅ **Key TypeScript patterns:**
- `import type { Request, Response, NextFunction } from 'express'` → Import only types (not values)
- `Number(req.params.id)` → Explicit conversion with type safety
- Route handlers all follow the same typed signature

---

### 🔹 Step 11: Server Entry Point (`src/server.ts`)

```typescript
// src/server.ts
import express, { Application } from 'express';
import cors from 'cors';
import { errorHandler } from './_middleware/errorHandler';
import { initialize } from './_helpers/db';
import usersController from './users/users.controller';

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// API Routes
app.use('/users', usersController);

// Global Error Handler (must be last)
app.use(errorHandler);

// Start server + initialize database
const PORT = process.env.PORT || 4000;

initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`🧪 Test with: POST /users with { email, password, ... }`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });
```

✅ **TypeScript highlights:**
- `Application` type → Typed Express app instance
- `initialize().then()` → Proper async initialization before starting server
- `process.exit(1)` → Exit with error code if DB fails

---

## 🧪 API Testing Guide (No Frontend Needed!)

> **💬 Discussion: Why Test APIs Directly?**
>
> **Student:** "Can't we just test with a frontend?"
>
> **Instructor:** "You could, but testing APIs directly with Postman/curl is faster and more reliable. You isolate backend bugs from frontend issues, test edge cases easily, and document expected request/response formats. Plus, it's how professional backend devs work!"

### 🔹 Testing Setup

1. Start your API:

```bash
npm run start:dev
```

You should see: `✅ Server running on http://localhost:4000`

2. Open Postman (or use curl in terminal)

---

### Test 1: Create a User (POST /users)

**Request:**
```http
POST http://localhost:4000/users
Content-Type: application/json

{
  "title": "Mr",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "password": "secret123",
  "confirmPassword": "secret123",
  "role": "User"
}
```

**Expected Response (200 OK):**
```json
{
  "message": "User created"
}
```

✅ **TypeScript validation:** If you send `role: "SuperAdmin"`, Joi + TypeScript will reject it because the `Role` enum only allows `"Admin"` or `"User"`.

---

### Test 2: Get All Users (GET /users)

**Request:**
```http
GET http://localhost:4000/users
```

**Expected Response (200 OK):**
```json
[
  {
    "id": 1,
    "email": "jane@example.com",
    "title": "Mr",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "User",
    "createdAt": "2026-02-18T10:00:00.000Z",
    "updatedAt": "2026-02-18T10:00:00.000Z"
  }
]
```

> ⚠️ **Note:** `passwordHash` is excluded by default (thanks to Sequelize `defaultScope`)!

---

### Test 3: Get User by ID (GET /users/:id)

**Request:**
```http
GET http://localhost:4000/users/1
```

**Expected Response (200 OK):**
```json
{
  "id": 1,
  "email": "jane@example.com",
  ...
}
```

**Error Case (404 Not Found):**
```http
GET http://localhost:4000/users/999
```
```json
{
  "message": "User not found"
}
```

---

### Test 4: Update User (PUT /users/:id)

**Request:**
```http
PUT http://localhost:4000/users/1
Content-Type: application/json

{
  "firstName": "Janet",
  "password": "newsecret456",
  "confirmPassword": "newsecret456"
}
```

**Expected Response (200 OK):**
```json
{
  "message": "User updated"
}
```

✅ **TypeScript safety:** The `updateSchema` uses `.empty('')` to make fields optional — TypeScript enforces this at compile time!

---

### Test 5: Delete User (DELETE /users/:id)

**Request:**
```http
DELETE http://localhost:4000/users/1
```

**Expected Response (200 OK):**
```json
{
  "message": "User deleted"
}
```

---

### Test 6: Validation Errors (Bad Request)

**Request (missing required field):**
```http
POST http://localhost:4000/users
Content-Type: application/json

{
  "firstName": "Bob"
  // Missing email, password, etc.
}
```

**Expected Response (400 Bad Request):**
```json
{
  "message": "Validation error: email is required, password is required, ..."
}
```

✅ **TypeScript + Joi combo:** TypeScript catches type errors at compile time; Joi catches validation errors at runtime. Double protection!

---

## 🛠 Common Issues & Troubleshooting

| Problem | Likely Cause | TypeScript-Specific Fix |
|---|---|---|
| ❌ "Cannot find module" | Wrong import path | Check `tsconfig.json` `paths` config |
| ❌ "Property 'X' does not exist on type" | Missing type definition | Add interface or use `as Type` assertion |
| ❌ "TS2345: Argument of type 'string' is not assignable" | Type mismatch | Check function signatures match Express types |
| ❌ "Cannot find name 'require'" | Using CommonJS in ESModule | Ensure `module: "commonjs"` in `tsconfig.json` |
| ❌ API not starting | DB connection failed | Verify MySQL is running + `config.json` credentials |

> 💡 **Debug tip:** Add `console.log(typeof variable)` to check runtime types during development.

---

## Deliverables (Submit These)

**1. Code:**
- Complete TypeScript backend (`src/`, `tsconfig.json`, `package.json`)
- All files properly typed with interfaces/enums
- `README.md` with setup + testing instructions

**2. API Test Evidence (screenshots or curl logs):**
- ✅ Successful user creation (POST /users)
- ✅ Get all users (GET /users) showing typed response
- ✅ Validation error for missing field (400 response)
- ✅ Delete user (DELETE /users/:id)

**3. Short Reflection (3–5 sentences):**
> "How did TypeScript change your development experience? Did you catch any errors at compile time that would have been runtime bugs in JavaScript?"

---

## 🚀 Extension Challenges (Optional)

Try these if you finish early:

1. 🔐 **Add JWT Authentication:** Create `/auth/login` and `/auth/register` endpoints with typed request/response interfaces
2. 🧪 **Write Automated Tests:** Use Jest + Supertest to test endpoints programmatically
3. 📚 **Add Swagger Documentation:** Use `swagger-jsdoc` + `swagger-ui-express` to auto-generate API docs from TypeScript comments
4. ♻️ **Add Pagination:** `GET /users?page=2&limit=10` with typed query params
5. 🌐 **Add Environment Config:** Use `dotenv` + typed environment variables with `zod`

---

## 💬 Final Discussion: TypeScript in Production

> **Student:** "Is TypeScript worth the extra setup for real projects?"
>
> **Instructor:** "Absolutely! Companies like Microsoft, Slack, and Airbnb use TypeScript because it:
> - 🐛 Catches bugs before deployment
> - 📖 Serves as living documentation
> - 👥 Makes onboarding new devs easier
> - 🔄 Enables safer refactoring
>
> The 10 minutes you spend setting up `tsconfig.json` can save hours of debugging later. Plus, your future self will thank you!"

---

## 📚 Helpful Resources

| Resource | Link |
|---|---|
| TypeScript Handbook | https://www.typescriptlang.org/docs/ |
| Sequelize + TypeScript | https://sequelize.org/master/manual/typescript.html |
| Postman | https://www.postman.com |
| MySQL Download | https://dev.mysql.com/downloads/ |
| Express Types | https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/express |

---

> 🙋 **Stuck?**
> 1. Run `npx tsc --noEmit` to check for TypeScript errors without compiling
> 2. Check VS Code's Problems panel for real-time type errors
> 3. Ask your instructor or a classmate!

---

✅ **You've leveled up!** You now have a production-ready, typed CRUD API that any frontend can consume. In the next activity, you'll build a React/Angular frontend to connect to this API. Keep coding! 💪

---

*Handout v1.0 | © 2026 Integrative Programming and Technologies | For educational use only*
