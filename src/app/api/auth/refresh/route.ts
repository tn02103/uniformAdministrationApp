import { refreshToken } from "@/dal/auth/refresh/refreshAccessToken";
import { NextResponse } from "next/server";

export const POST = async () => {
    return refreshToken().then((response) => {
        return NextResponse.json({ message: response.message }, { status: response.status });
    }).catch((error) => {
        console.error("Error refreshing token:", error);
        return NextResponse.json({ message: "Unknown error occurred" }, { status: 500 });
    });
}