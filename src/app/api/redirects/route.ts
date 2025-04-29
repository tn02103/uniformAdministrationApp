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
    return NextResponse.redirect("https://www.verkehrskadetten-mettmann.de/index.php", 302);
}
