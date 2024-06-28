# Turiy MySQL Package

This package is made on `mysql2` and `next`. The functions exported here is treated as server side functions. This package is able to create connection with your _MySQL_ database and handle user authentication.

## Environment Variables

Remember to add following at your `.env.local`

> - CRYPTO_PASSWORD [optional]

> - MYSQL_HOST
> - MYSQL_USER
> - MYSQL_PASSWORD
> - MYSQL_DATABASE

## Queries with `where` clause

Select queries

- `select({user: {where: "(userId, password) IN (('123456789', 'P#@$%745458'))"}})`
- `select({user: {where: "rating>2000"}})`

Update queries

- `update({item: {price: 200, discount: 5}}, {where: "(itemId) IN (('IT78945'))"})`
- `update({item: {price: 200, discount: 5}}, {where: "price=300"})`

Delete queries

- `del({item: {where: "(itemId) IN (('IT78945'))"}})`
- `del({item: {where: "price<10"}})`

## Queries without `where` clause

> These queries only checks the equality of the given fields.

Select queries

- `select({user: {userId: 123456789, password: "P#@$%745458"}})`

Update queries

- `update({item: {price: 200, discount: 5}}, {itemId: "IT78945"})`

Delete queries

- `del({item: {itemId: "IT78945"}})`

## Other queries

Insert queries

- `insert({item: {itemId: "IT78945", price:300, discount: 15}})`

> You can directly executes any `SQL` queries including complex queries with the `execute`.

- `execute("SELECT ...")`
- `execute("INSERT ...")`
- `execute("UPDATE ...")`
- `execute("DELETE ...")`
