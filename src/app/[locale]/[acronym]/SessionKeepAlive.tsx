"use client";
/* eslint-disable no-console */

import { refreshAccessToken } from "@/dal/auth";
import dayjs from "@/lib/dayjs";
import { useEffect } from "react";
import { useSessionStorage } from "usehooks-ts";

type LastAccessTokenRefreshType = {
    lastSuccess: Date | null;
    lastTry: Date | null;
    state: "initial" | "in-progress" | "success" | "failed";
}
const Config = {
    taskInterval: 5,
    refreshInterval: 10,
}

export const SessionKeepAlive = () => {
    const [lastAccessTokenRefresh, setAccessTokenRefresh] = useSessionStorage<LastAccessTokenRefreshType>("lastAccessTokenRefresh", {
        lastSuccess: null,
        lastTry: null,
        state: "initial"
    });

    useEffect(() => {
        const handleAccessTokenRefresh = () => {
            const now = dayjs();
           
            // Prevent multiple refresh attempts within 5 seconds
            if (lastAccessTokenRefresh.lastTry &&
                now.diff(dayjs(lastAccessTokenRefresh.lastTry), 'seconds') < 5) {
                console.log("Refresh attempt too recent, skipping");
                return;
            }
            // Prevent overlapping refresh attempts
            if (lastAccessTokenRefresh.state === "in-progress") {
                console.log("🚀 ~ SessionKeepAlive ~ Access token refresh already in progress. Skipping new attempt.");
                return;
            }
            setAccessTokenRefresh({ ...lastAccessTokenRefresh, state: "in-progress" });
            
            // Attempt to refresh the access token
            refreshAccessToken().then((result) => {
                console.log("🚀 ~ SessionKeepAlive ~ result:", result)
                if (result.success) {
                    setAccessTokenRefresh({ lastSuccess: new Date(), lastTry: new Date(), state: "success" });
                } else {
                    setAccessTokenRefresh({ ...lastAccessTokenRefresh, lastTry: new Date(), state: "failed" });
                }
            }).catch((e) => {
                setAccessTokenRefresh({ ...lastAccessTokenRefresh, lastTry: new Date(), state: "failed" });
                if (process.env.NODE_ENV === 'development') {
                    console.error("Session keep-alive: Unable to refresh access token", e);
                }
            });
        }

        
        if (lastAccessTokenRefresh.state === "initial" || lastAccessTokenRefresh.state === "failed") {
            handleAccessTokenRefresh();
        }
        console.log("🚀 ~ SessionKeepAlive ~ Setting up interval to refresh access token every 10 seconds");
        const interval = setInterval(() => {
            console.log("🚀 ~ SessionKeepAlive ~ Checking if access token needs refresh", dayjs().format("dd.MM.yyyy HH:mm:ss"));
            const timeToRefresh = lastAccessTokenRefresh.lastSuccess
                ? dayjs(lastAccessTokenRefresh.lastSuccess).add(Config.refreshInterval, 'seconds').isAfter(dayjs())
                : true;
            console.log("🚀 ~ SessionKeepAlive ~ lastAccessTokenRefresh:", lastAccessTokenRefresh, timeToRefresh)
            if (lastAccessTokenRefresh.state === "failed" || timeToRefresh) {
                handleAccessTokenRefresh();
            }
        }, Config.refreshInterval * 1000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}