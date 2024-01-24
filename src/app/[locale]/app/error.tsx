"use client"

import CustomException from "@/errors/CustomException";
import { useEffect } from "react"


export default function ErrorHandler({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.log("Cought Error:", error, typeof error);
        console.log(Object.entries(error));
        if (error instanceof CustomException) {
            console.log(error.exceptionType);
        }
    }, [error])

    return (
        <div>
            Something is wrong
        </div>
    )
}