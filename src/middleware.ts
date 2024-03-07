import { createI18nMiddleware } from "next-international/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "./lib/ironSession";


const I18nMiddleware = createI18nMiddleware({
    locales: ['en', 'de'],
    defaultLocale: 'de'
});

export async function middleware(request: NextRequest) {
    const response = I18nMiddleware(request);

    if (request.nextUrl.pathname.length < 4) {
        const session = await getIronSession();
        if (!session.user) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.redirect(new URL('/app/cadet', request.url));
    }

    if (request.nextUrl.pathname.endsWith('/app/uniform/list')) {
        return NextResponse.rewrite(new URL(`/${response.headers.get('x-next-locale')}/app/uniform/list/null`, request.url));
    }

    return response;
}

export const config = {
    matcher: ['/((?!api|static|.*\\..*|_next|favicon.ico|robots.txt).*)']
}
