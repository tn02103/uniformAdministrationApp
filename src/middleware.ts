import { createI18nMiddleware } from "next-international/middleware";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "./lib/auth";

const I18nMiddleware = createI18nMiddleware({
    locales: ['en', 'de'],
    defaultLocale: 'de',
});

export async function middleware(request: NextRequest) {
    const response = I18nMiddleware(request);
    if (response.status === 307) {
        return response;
    }

    const session = await auth.api.getSession({ headers: request.headers });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session?.user as (Record<string, any> & { acronym?: string }) | undefined;

    if (request.nextUrl.pathname.length < 4) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.redirect(new URL('/app', request.url));
    }

    const pathnameParts = request.nextUrl.pathname.split("/");
    if (request.nextUrl.pathname.endsWith('/uniform/list')) {
        if (!user?.acronym) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        const urlSring = `/${response.headers.get('x-next-locale')}/${user.acronym}/uniform/list/null`
        return NextResponse.rewrite(new URL(urlSring, request.url), response);
    } else if (pathnameParts[2] === "app") {
        if (!user?.acronym) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.rewrite(new URL(request.url.replace('app', user.acronym)), response);
    }

    return response;
}

export const config = {
    matcher: ['/((?!api|static|.*\\..*|_next|favicon.ico|robots.txt).*)']
}

