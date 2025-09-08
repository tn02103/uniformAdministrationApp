"use client";
/* eslint-disable no-console */

import { refreshAccessToken } from "@/dal/auth";
import dayjs from "@/lib/dayjs";
import { useEffect } from "react";
import { useSessionStorage } from "usehooks-ts";

type LastAccessTokenRefreshType = {
    time: Date | null;
    state: "initial" | "in-progress" | "success" | "failed";
}
const Config = {
    taskInterval: 5,
    refreshInterval: 10,
}

export const SessionKeepAlive = () => {
    const [lastAccessTokenRefresh, setAccessTokenRefresh] = useSessionStorage<LastAccessTokenRefreshType>("lastAccessTokenRefresh", {
        time: null,
        state: "initial"
    });

    useEffect(() => {
        const handleAccessTokenRefresh = () => {
            refreshAccessToken().then((result) => {
                console.log("🚀 ~ SessionKeepAlive ~ result:", result)
                if (result.success) {
                    setAccessTokenRefresh({ time: new Date(), state: "success" });
                } else {
                    setAccessTokenRefresh({ ...lastAccessTokenRefresh, state: "failed" });
                }
            }).catch((e) => {
                setAccessTokenRefresh({ ...lastAccessTokenRefresh, state: "failed" });
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
            const timeToRefresh = lastAccessTokenRefresh.time ? dayjs(lastAccessTokenRefresh.time).add(Config.refreshInterval, 'seconds').isAfter(dayjs()) : true;
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