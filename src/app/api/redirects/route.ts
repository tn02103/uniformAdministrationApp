import { NextResponse } from "next/server";


export async function GET(request: Request) {

    const { searchParams } = new URL(request.url);
    const redirectCode = searchParams.get("code");

    if (redirectCode === "12345") {
        return NextResponse.redirect("https://www.verkehrskadetten-mettmann.de/index.php?id=mitmachen", 302);
    }
    return NextResponse.json({ message: "Redirect not found" }, { status: 404 });
}