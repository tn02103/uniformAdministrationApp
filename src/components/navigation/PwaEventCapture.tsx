"use client";

// This module-level code runs immediately when React hydrates the root layout,
// which is before the user logs in and well before SidebarFooter mounts.
// It captures the beforeinstallprompt event so PwaInstallButton can read it later.
if (typeof window !== "undefined") {
    window.addEventListener("beforeinstallprompt", (e: Event) => {
        e.preventDefault();
        window.__pwaPrompt = e as any;
    });
}

export function PwaEventCapture() {
    return null;
}
