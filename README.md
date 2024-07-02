
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
DATABASE_URL=postgres://{{username}}:{{password}}@{{url}}/{{database}}"
STAGE={{DEV | BETA | PRO}}
IRON_SESSION_COOKIE_NAME=name of the ironSession cookie
IRON_SESSION_KEY=complex password at least 32 characters long
REFRESH_TOKEN_KEY=secret to generate refreshtoken at least 32 characters long
NEXT_PUBLIC_LOCAL_AUTH_KEY=key for localstorage where authItem is placed
TEST_USER_PASSWORD=password used by tests
USER_PASSWORD=password used in db Seed
```

## Database/ Prisma
### To initialize:
- add DATABASE_URL to .env
- run `npx prisma db push` to create tables
- run `npx prisma db seed` to fill tables with DEV-Data

### Migrations
-> comming soon

## Playwright
To initialize:
- run command `npx playwright install`
- create `staticDataIds.json` in test -> testData and run test `generateTestIdSet` one time
- make sure you have a production build -> run `npm run build`

To run test use command `npx playwright test`

