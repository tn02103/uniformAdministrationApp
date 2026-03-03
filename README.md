
## Getting Started
### First Steps
- create .env
- run `npm i`
- connect to database or create database
### Start Project:
- `npm run dev` to start in development mode
- `npm run build` & `npm run start` to start project as Production build


## .env
```
DATABASE_URL="postgres://{{username}}:{{password}}@{{url}}/{{database}}"
DATABASE_URL_SHADOW=Database for prisma migrations
STAGE={{DEV | BETA | PRO}}
BETTER_AUTH_SECRET=random secret at least 32 characters long (generate with: openssl rand -base64 32)
BETTER_AUTH_URL=base URL of the app (e.g. http://localhost:3021)
NEXT_PUBLIC_APP_URL=same as BETTER_AUTH_URL, used by the client-side auth library
NEXT_PUBLIC_LOCAL_AUTH_KEY=key for localstorage where authItem is placed
USER_PASSWORD=password used in db Seed
TEST_USER_PASSWORD=password used by tests
TEST_WORKERS=amount of playwrigt workers
```

> **Removed env vars** (no longer needed after migration to better-auth):
> `IRON_SESSION_COOKIE_NAME`, `IRON_SESSION_KEY`, `REFRESH_TOKEN_KEY`

## Database/ Prisma
### To initialize:
- add DATABASE_URL to .env
- run `npx prisma db push` to create tables
- run `npx prisma db seed` to fill tables with DEV-Data


### Migrations
- run `npx prisma migrate deploy` for migrations in production server
- run `npx prisma migrate dev` to generate new migration on dev Server
- run `npx prisma migrate reset` to reset the database. Runs the seed scritp after migrations.


## Playwright
To initialize:
- run command `npx playwright install`
- create `staticDataIds.json` in test -> testData and run test `generateTestIdSet` one time
- make sure you have a production build -> run `npm run build`

To run test use command `npx playwright test`

