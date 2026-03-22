import { Login } from "@/dal/auth/login";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
    const body = await request.json();
    return Login(body).then((response) => {
        return NextResponse.json({ ...response }, { status: response.loginSuccessful ? 200 : 401 });
    }).catch((error) => {
        console.error("Error logging in:", error);
        return NextResponse.json({ message: "Unknown error occurred" }, { status: 500 });
    });
}