"use client"

import CustomException from "@/errors/CustomException";
import { useEffect } from "react"


export default function ErrorHandler({
    error,
}: {
    error: Error & { digest?: string }
}) {
    useEffect(() => {
        if (error instanceof CustomException) {
            console.error(error.exceptionType);
        }
    }, [error])

    return (
        <div>
            Something is wrong
        </div>
    )
}