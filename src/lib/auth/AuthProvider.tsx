"use client"

import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import dayjs from "@/lib/dayjs";
import { mutate } from "swr";
import { userLogout } from "@/dal/auth";
import { AuthConfig } from "@/dal/auth/config";

interface AuthState {
    lastAccessTokenRefresh: {
        lastSuccess: string | null;
        lastTry: string | null;
        state: "initial" | "success" | "failed";
    };
    isAuthenticated: boolean;
    isRefreshing: boolean;
}

interface AuthContextValue extends AuthState {
    refreshToken: () => Promise<void>;
    logout: () => Promise<void>;
    onLoginSuccess: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const pathname = usePathname();
    const router = useRouter();
    const params: { locale: string, acronym?: string} = useParams(); 

    // Determine if we need auth functionality
    // Check if route matches pattern: /[locale]/[acronym]/... or /[locale]/login
    const pathParts = pathname.split('/').filter(Boolean);
     const isLoginRoute = pathParts.length >= 2 && pathParts[1] === 'login';
    const isAcronymRoute = params.acronym !== undefined;
    const isAuthRoute = isLoginRoute || isAcronymRoute;
    const isProtectedRoute = isAcronymRoute;

    const [authState, setAuthState] = useState<AuthState>(() => ({
        lastAccessTokenRefresh: {
            lastSuccess: null,
            lastTry: null,
            state: "initial"
        },
        isAuthenticated: isProtectedRoute, // Assume authenticated if on protected route
        isRefreshing: false
    }));

    const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const storageKey = 'uniform-auth-state';
    const channelName = 'uniform-auth-sync';

    // Initialize cross-tab communication only on auth routes
    useEffect(() => {
        if (!isAuthRoute) return;

        // BroadcastChannel setup
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            broadcastChannelRef.current = new BroadcastChannel(channelName);

            broadcastChannelRef.current.onmessage = (event) => {
                console.debug("AuthProvider ~ BroadcastChannel message received:", event.data);
                const { type, data } = event.data;

                switch (type) {
                    case 'TOKEN_REFRESHED':
                        setAuthState(prev => ({
                            ...prev,
                            lastAccessTokenRefresh: data,
                            isRefreshing: false
                        }));
                        break;
                    case 'LOGIN_SUCCESS':
                        setAuthState(prev => ({
                            ...prev,
                            isAuthenticated: true,
                            lastAccessTokenRefresh: data.tokenState
                        }));
                        // Redirect if on login page
                        if (pathname.includes('/login')) {
                            router.push(data.redirectUrl);
                        }
                        break;
                    case 'LOGOUT':
                        setAuthState(prev => ({
                            ...prev,
                            isAuthenticated: false
                        }));
                        mutate(() => true, null);
                        // Redirect to login if on protected route
                        if (pathname.includes('/app')) {
                            router.push(`/${params.locale}/login`);
                        }
                        break;
                }
            };
        }

        // Storage fallback
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === storageKey && event.newValue) {
                const data = JSON.parse(event.newValue);
                setAuthState(prev => ({ ...prev, ...data }));
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            broadcastChannelRef.current?.close();
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [isAuthRoute, pathname, router, params.locale]);

    // Auto-refresh only on protected routes
    useEffect(() => {
        if (!isProtectedRoute || !authState.isAuthenticated) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            return;
        };

        const startAutoRefresh = () => {
            intervalRef.current = setInterval(async () => {
                const now = dayjs();
                console.debug("AuthProvider ~ Checking if access token needs refresh", now.format("DD.MM.YYYY HH:mm:ss"));
                const lastSuccess = authState.lastAccessTokenRefresh.lastSuccess
                    ? dayjs(authState.lastAccessTokenRefresh.lastSuccess)
                    : null;

                if (!lastSuccess || now.diff(lastSuccess, 'second') >= AuthConfig.accessToken.refreshInterval) {
                    await refreshToken();
                }
            }, AuthConfig.accessToken.keepAliveCheckInterval * 1000);
        };

        startAutoRefresh();

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isProtectedRoute, authState.isAuthenticated, authState.lastAccessTokenRefresh]);

    const refreshToken = useCallback(async () => {
        console.debug("AuthProvider ~ refreshToken called");
        if (authState.isRefreshing) return;

        setAuthState(prev => ({ ...prev, isRefreshing: true }));
        const now = dayjs().toISOString();

        try {
            const response = await fetch('/api/auth/refresh', { method: 'POST' });
            console.debug("AuthProvider ~ refreshToken response:", response);

            if (response.ok) {
                const newTokenState = {
                    lastSuccess: now,
                    lastTry: now,
                    state: "success" as const
                };

                setAuthState(prev => ({
                    ...prev,
                    lastAccessTokenRefresh: newTokenState,
                    isRefreshing: false
                }));

                // Broadcast to other tabs
                broadcastChannelRef.current?.postMessage({
                    type: 'TOKEN_REFRESHED',
                    data: newTokenState
                });

                localStorage.setItem(storageKey, JSON.stringify({
                    lastAccessTokenRefresh: newTokenState
                }));
                console.debug("AuthProvider ~ Token refreshed and stored in localStorage");
            } else {
                console.debug("AuthProvider ~ Token refresh failed with status:", response.status);
                const errorState = {
                    lastSuccess: authState.lastAccessTokenRefresh.lastSuccess,
                    lastTry: now,
                    state: "failed" as const
                };

                setAuthState(prev => ({
                    ...prev,
                    lastAccessTokenRefresh: errorState,
                    isRefreshing: false,
                    isAuthenticated: false
                }));

                // Redirect to login
                router.push(`/${params.locale}/login`);
            }
        } catch (_) {
            setAuthState(prev => ({
                ...prev,
                isRefreshing: false,
                lastAccessTokenRefresh: {
                    ...prev.lastAccessTokenRefresh,
                    lastTry: now,
                    state: "failed"
                }
            }));
        }
    }, [authState.isRefreshing, authState.lastAccessTokenRefresh.lastSuccess, router, params.locale]);

    const logout = useCallback(async () => {
        await userLogout().then(() => {
            setAuthState(prev => ({
                ...prev,
                isAuthenticated: false
            }));

            // Broadcast to other tabs
            broadcastChannelRef.current?.postMessage({ type: 'LOGOUT' });
            localStorage.removeItem(storageKey);

            mutate(() => true, null);
            router.push(`/${params.locale}/login`);
        }).catch((error) => {
            console.error('Logout failed:', error);
        });
    }, [router, params.locale]);

    const onLoginSuccess = useCallback(() => {
        const redirectUrl = `/${params.locale}/app/cadet`;
        const now = dayjs().toISOString();

        const tokenState = {
            lastSuccess: now,
            lastTry: now,
            state: "success" as const
        };

        setAuthState(prev => ({
            ...prev,
            isAuthenticated: true,
            lastAccessTokenRefresh: tokenState
        }));

        // Broadcast to other tabs
        broadcastChannelRef.current?.postMessage({
            type: 'LOGIN_SUCCESS',
            data: { tokenState, redirectUrl }
        });

        localStorage.setItem(storageKey, JSON.stringify({
            lastAccessTokenRefresh: tokenState,
            isAuthenticated: true
        }));

        router.push(redirectUrl);
    }, [router, params.locale]);

    // Don't render context on non-auth routes
    if (!isAuthRoute) {
        return <>{children}</>;
    }

    const contextValue: AuthContextValue = {
        ...authState,
        refreshToken,
        logout,
        onLoginSuccess
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider on an auth route');
    }
    return context;
};