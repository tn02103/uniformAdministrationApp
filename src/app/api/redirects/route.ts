import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const redirectCode = searchParams.get("code");

    const redirectRegex = /^[a-zA-Z0-9-]{1,30}$/;
    if (redirectCode && redirectRegex.test(redirectCode)) {
        const redirect = await prisma.redirect.findFirst({
            where: {
                code: redirectCode,
                active: true,
            },
        })

        if (redirect) {
            return NextResponse.redirect(redirect.target, 302);
        }
    }
    if (process.env.DEFAULT_REDIRECT_URL) {
        return NextResponse.redirect(process.env.DEFAULT_REDIRECT_URL, 302);
    }
    return NextResponse.json({
        message: "No redirect found"
    }, { status: 404 });
}
