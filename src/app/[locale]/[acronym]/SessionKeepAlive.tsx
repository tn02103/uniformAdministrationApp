"use client";

import { refreshAccessToken } from "@/dal/auth";
import { useEffect } from "react";

export const SessionKeepAlive = () => {
    useEffect(() => {
        const interval = setInterval(() => {
            refreshAccessToken().catch((e) => {
                if (process.env.NODE_ENV === 'development') {
                    console.error("Session keep-alive: Unable to refresh access token", e);
                }
            });
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, []);

    return null;
}