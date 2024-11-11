
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
IRON_SESSION_COOKIE_NAME=name of the ironSession cookie
IRON_SESSION_KEY=complex password at least 32 characters long
REFRESH_TOKEN_KEY=secret to generate refreshtoken at least 32 characters long
NEXT_PUBLIC_LOCAL_AUTH_KEY=key for localstorage where authItem is placed
USER_PASSWORD=password used in db Seed
TEST_USER_PASSWORD=password used by tests
TEST_WORKERS=amount of playwrigt workers
```

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

