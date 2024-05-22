import { createI18nMiddleware } from "next-international/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "./lib/ironSession";
import { prisma } from "./lib/db";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";


const I18nMiddleware = createI18nMiddleware({
    locales: ['en', 'de'],
    defaultLocale: 'de',
});

export async function middleware(request: NextRequest) {
    const response = I18nMiddleware(request);
    if (response.status === 307) {
        return response;
    }

    const session = await getIronSession();

    if (request.nextUrl.pathname.length < 4) {
        if (!session.user) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.redirect(new URL('/app', request.url));
    }

    const pathnameParts = request.nextUrl.pathname.split("/");
    if (request.nextUrl.pathname.endsWith('/uniform/list')) {
        const urlSring = `/${response.headers.get('x-next-locale')}/${session.user?.acronym}/uniform/list/null`
        return NextResponse.rewrite(new URL(urlSring, request.url), response);
    } else if (pathnameParts[2] === "app") {
        if (!session.user) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.rewrite(new URL(request.url.replace('app', session.user.acronym)), response);
    }

    return response;
}

export const config = {
    matcher: ['/((?!api|static|.*\\..*|_next|favicon.ico|robots.txt).*)']
}
