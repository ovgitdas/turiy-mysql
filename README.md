# Turiy MySQL

> A streamlined MySQL and authentication toolkit for Next.js Server Components.

**Author:** Abhijit Das

---

## Overview

`turiy-mysql` is a lightweight, server-side library designed specifically for **Next.js** applications that use Server Components (`"use server"`). It simplifies database interactions and session-based authentication by providing a concise, intuitive API for common tasks.

### Key Features

- **Simplified CRUD:** Perform `INSERT`, `SELECT`, `UPDATE`, and `DELETE` operations with simple JavaScript objects.
- **Session Management:** Secure, cookie-based authentication flow (`signin`, `signout`, `authCheck`).
- **Server-Side Focus:** Built for the modern Next.js stack, ensuring code runs securely on the server.
- **Efficient Connections:** Utilizes a cached connection pool to manage database connections efficiently.
- **Zero Dependencies (on the client):** Keeps your client-side bundles clean and fast.

---

## Core Concepts

The library's API revolves around two simple data structures: `Table` and `Tuple`.

Think of your database as a filing cabinet.

- `Table`: This represents a single drawer in the cabinet, identified by the table's name. It's an object with one key: the table name.
- `Tuple`: This represents a single file or a set of query conditions within that drawer. It's a simple key-value object.

**Analogy in Code:**

```typescript
// A 'Tuple' is like a single file's data or a query filter.
const userData: Tuple = { name: "Abhijit", role: "Developer" };

// A 'Table' object points to the 'user' table (the drawer)
// and contains the data (the file).
const userTable: Table = {
  user: userData,
};
```

---

## Getting Started

### 1. Installation

```bash
npm install turiy-mysql
```

### 2. Environment Variables

Create a `.env.local` file in the root of your project and add the following variables. These are essential for connecting to your MySQL database and securing sessions.

```env
# --- Database Connection ---
MYSQL_HOST=your_database_host
MYSQL_USER=your_database_user
MYSQL_PASSWORD=your_database_password
MYSQL_DATABASE=your_database_name

# Optional: Max connections in the pool (defaults to 10)
MYSQL_POOL_CONNECTION_LIMIT=10

# --- Session Encryption ---
# IMPORTANT: A long, random, and secret string for encrypting session cookies.
# You can generate one using `openssl rand -base64 32`
CRYPTO_PASSWORD=your_secret_encryption_key
```

---

## Database (CRUD) Operations

All database functions are `async` and should be awaited.

### `insert()`

Adds a new row to a table.

```typescript
import { insert } from "turiy-mysql";

const newUser = await insert({
  users: { name: "Jane Doe", email: "jane.doe@example.com", active: 1 },
});

if (newUser) {
  console.log("User created successfully!");
}
```

### `select()`

Retrieves rows from a table. You can query by simple equality or by providing a custom `where` string.

**Example 1: Simple Equality Check**

This finds a user where `userId` is '123' AND `status` is 'active'.

```typescript
import { select } from "turiy-mysql";

const users = await select({
  users: { userId: "123", status: "active" },
});
```

**Example 2: Custom `where` Clause**

This gives you full SQL power for complex queries.

```typescript
import { select } from "turiy-mysql";

const premiumUsers = await select({
  users: { where: "subscription = 'premium' AND last_login > '2023-01-01'" },
});
```

### `update()`

Updates one or more rows matching a condition.

```typescript
import { update } from "turiy-mysql";

const wasUpdated = await update(
  { users: { status: "inactive" } }, // The new data to set
  { userId: "456" } // The condition (WHERE userId = '456')
);
```

### `del()`

Deletes rows matching a condition.

```typescript
import { del } from "turiy-mysql";

const wasDeleted = await del({
  logs: { where: "timestamp < '2022-01-01'" },
});
```

### `execute()`

For ultimate flexibility, you can run any raw SQL query.

```typescript
import { execute } from "turiy-mysql";

const results = await execute(
  "SELECT COUNT(*) as total FROM posts WHERE author_id = 123;"
);
```

---

## Authentication

The authentication system works by issuing a secure, encrypted, `HttpOnly` cookie to the user upon a successful sign-in. This cookie acts like a keycard. On subsequent requests, the server validates this keycard to confirm the user's identity.

### `signin()`

Verifies user credentials against the database. If successful, it creates a session and sends the encrypted session cookie to the browser.

```typescript
import { signin } from "turiy-mysql";

export async function handleLogin(formData) {
  "use server";
  const email = formData.get("email");
  const password = formData.get("password");

  const user = await signin({
    users: { email, password, active: 1 },
  });

  if (user) {
    // Redirect to dashboard
  } else {
    // Show error message
  }
}
```

### `signout()`

Deletes the session cookie, effectively logging the user out.

```typescript
import { signout } from "turiy-mysql";

export async function handleLogout() {
  "use server";
  await signout();
  // Redirect to login page
}
```

### `authCheck()`

Checks the incoming request for a valid session cookie. Use this in your layouts, pages, or API routes to protect content and actions.

```typescript
import { authCheck } from "turiy-mysql";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const user = await authCheck();

  if (!user) {
    redirect("/login");
  }

  return <div>Welcome, {user.name}!</div>;
}
```

### `authCheckFor()`

This is a specialized version of `authCheck` for server-to-server communication, most commonly between **Next.js Middleware** and an **API Route**.

Since middleware has a different runtime context and cannot directly read the decrypted cookie, it needs to pass the raw cookie value and headers to an API route, which then uses `authCheckFor` to perform the validation.

**Flow:**

1.  **In `middleware.ts`**, get the client auth details.

    ```typescript
    import { getBrowserClientAuth } from "turiy-mysql";

    const clientAuth = await getBrowserClientAuth();
    ```

2.  The middleware then calls an internal API route, passing these details.
    ```typescript
    const response = await fetch("https://your-app.com/api/auth-check", {
      method: "POST",
      body: JSON.stringify(clientAuth),
    });
    const data = await response.json(); // Contains user info or null
    ```
3.  **In `/api/auth-check/route.ts`**, use `authCheckFor` to validate the details.

    ```typescript
    import { authCheckFor } from "turiy-mysql";

    export async function POST(req: Request) {
      const { sessionCipher, ip, agent } = await req.json();
      const user = await authCheckFor({ sessionCipher, ip, agent });
      return Response.json(user); // Responds with user data or null
    }
    ```

---

## Security Considerations

- **Encryption Key:** The `CRYPTO_PASSWORD` environment variable is critical for session security. **Never** commit it to version control. It should be a long, random, unique string for each environment.
- **SQL Injection:** When using the `where` property in `select()`, `update()`, or `del()`, you are writing a raw SQL fragment. **You are responsible for sanitizing this input** to prevent SQL injection attacks. The library's automatic value escaping only applies to simple key-value equality checks, not to custom `where` strings.

---

## License

This project is licensed under the MIT License.
