import { createI18nMiddleware } from "next-international/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "./lib/ironSession";

const I18nMiddleware = createI18nMiddleware({
    locales: ['en', 'de'],
    defaultLocale: 'de',
});

const unsecuredPaths = [
    ["api"],
    [, "login"],
    [, "docs"]
]

export async function proxy(request: NextRequest) {
    const response = I18nMiddleware(request);
    if (response.status === 307) {
        return response;
    }
    
    const pathname = request.nextUrl.pathname;
    const pathnameParts = pathname.substring(1).split("/");
    const session = await getIronSession();
   
    // Redirect root to /app or /login since no homepage is implemented
    if (request.nextUrl.pathname.length < 4) {
        if (!session.user) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.redirect(new URL('/app', request.url));
    }

    // Check if the path is unsecured (e.g. /api/*, /*/login, /*/docs/*)
    if (unsecuredPaths.some(parts => parts.every((part, index) => !part || pathnameParts[index] === part))) {
        return response;
    }

    // For all other paths, check if the user is authenticated
    if (!session.user) {
         return NextResponse.redirect(new URL('/login', request.url));
    }

    const rewrite = {
        required: false,
        url: request.url,
    };
    // rewrite /app/* to /:acronym/* to scope all app routes to the user's acronym
    if (pathnameParts[1] === "app") {
        rewrite.required = true;
        rewrite.url = rewrite.url.replace('app', session.user.acronym);
   }

    // rewrite /uniform/list to /uniform/list/null to correct for missing optional parameter in the route definition
    if (pathnameParts[2] === "uniform" && pathnameParts[3] === "list" && pathnameParts.length === 4) {
        rewrite.required = true;
        rewrite.url = rewrite.url.replace('/uniform/list', `/uniform/list/null`);
    }

    // rewrite if necessary, otherwise return the original response
    if (rewrite.required) {
        return NextResponse.rewrite(new URL(rewrite.url, request.url), { headers: response.headers });
    }

    return response;
}

export const config = {
    matcher: ['/((?!api|static|.*\\..*|_next|favicon.ico|robots.txt).*)']
}
