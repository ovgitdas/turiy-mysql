# Turiy MySQL Package

This package is made on `mysql2` and `next`. The functions exported here is treated as server side functions. This package is able to create connection with your _MySQL_ database using cached-connection-pool and handle user authentication and CRUD operations.

> **Recommended** to use inside `server components` or `use server` files.

## Environment Variables

Remember to add following at your `.env.local`

- CRYPTO_PASSWORD [optional]
- MYSQL_HOST
- MYSQL_USER
- MYSQL_PASSWORD
- MYSQL_DATABASE
- MYSQL_POOL_CONNECTION_LIMIT (10 by default)

## Queries with `where` clause

Select queries

```typescript
select({
  user: { where: "(userId, password) IN (('123456789', 'P#@$%745458'))" },
})
// or
select({ user: { where: "rating>2000" } })
```

Update queries

```typescript
update(
  { item: { price: 200, discount: 5 } },
  { where: "(itemId) IN (('IT78945'))" }
)
// or
update({ item: { price: 200, discount: 5 } }, { where: "price=300" })
```

Delete queries

```typescript
del({ item: { where: "(itemId) IN (('IT78945'))" } })
// or
del({ item: { where: "price<10" } })
```

## Queries without `where` clause

> These queries only checks the equality of the given fields.

Select queries

```typescript
select({ user: { userId: 123456789, password: "P#@$%745458" } })
```

Update queries

```typescript
update({ item: { price: 200, discount: 5 } }, { itemId: "IT78945" })
```

Delete queries

```typescript
del({ item: { itemId: "IT78945" } })
```

## Other queries

Insert queries

```typescript
insert({ item: { itemId: "IT78945", price: 300, discount: 15 } })
```

> You can directly executes any `SQL` queries including complex queries with the `execute`.

```typescript
execute("SELECT ...")
execute("INSERT ...")
execute("UPDATE ...")
execute("DELETE ...")
```

# Authentication

> Following functions are provided to handle authentication.

## Sign-in

`signin = async (userTable: Table): Promise<Tuple|undefined>`

> This function takes the user `table-name` and `field` information to check whether the given information exists inside database or not. If exists it returns the `tuple` containing complete user information as defined by your user table of your database; otherwise returns `undefined`.

```typescript
//_Examples are given here_
signin({ user: { id: "my-user-id", password: "my-password" } })
// or
signin({ user: { emailId: "my-user-id", password: "my-password" } })
//or
signin({ user: { emailId: "my-user-id", password: "my-password", active: 1 } })
```

## Sign-out

You only need to invoke `signout()`

## Auth check `client` to `server`

`authCheck = async (): Promise<Tuple|undefined>`

> After successfully signed-in this function is invoked for every request to see whether the user is signed-in or not. If the user is authentic and signed-in user, then it returns the `tuple` containing complete user information as defined by your user table of your database; otherwise returns `undefined`.
>
> _This function works only when the request is made directly from the user's browser._

## Auth check `client` to `middleware (server)` to `api (server)`

`authCheckFor = async ({sessionCipher, ip, agent}: BrowserClientAuth): Promise<Tuple|undefined>`

> This function works exactly same way as the above function `authCheck`. The only difference is that it allows the `middleware` to communicate with the `api` existing in the same server to validate the user authentication.
>
> _Since `middleware` doesn't have access to full functionality of server, it sometimes use `api` call to get information from the server._

> - At first `middleware` invokes the `browserClientAuth` function.
>   `getBrowserClientAuth = async (): Promise<BrowserClientAuth | undefined>`.

```typescript
const clientAuth = await getBrowserClientAuth()
```

> - Then `middleware` uses `fetch` or `axios` to invoke an `auth check api`.

```typescript
//Inside `middleware` this `api` is invoked
const response = await fetch("<api-url>", {
  method: "POST",
  body: JSON.stringify(clientAuth),
})
const userInfo = await response.json()
```

> - Then the `api`, that may be declared as follows, uses `authCheckFor` to validate the end user authentication. and response the user information to the `middleware`.

```typescript
//The `api` can be written as follows:
export async function POST(req: Request) {
  const { sessionCipher, ip, agent } = await req.json()
  const user = await authCheckFor({ sessionCipher, ip, agent })
  return Response.json(user)
}
```
