"use client";

import { faDownload, faMobileScreenButton } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useI18n } from "@/lib/locales/client";
import { useEffect, useRef, useState } from "react";
import { Dropdown, Modal } from "react-bootstrap";

// Derived from the Window augmentation in global.d.ts
type DeferredInstallPrompt = NonNullable<Window["__pwaPrompt"]>;

type InstallState = "idle" | "available" | "ios" | "installed";

export function PwaInstallButton() {
    const t = useI18n();
    const [state, setState] = useState<InstallState>("idle");
    const [showIosModal, setShowIosModal] = useState(false);
    const deferredPrompt = useRef<DeferredInstallPrompt | null>(null);

    useEffect(() => {
        // Already running as installed PWA
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setState("installed");
            return;
        }

        // iOS: Safari does not fire beforeinstallprompt — detect manually
        const isIos =
            /iphone|ipad|ipod/i.test(navigator.userAgent) &&
            !(window.navigator as { standalone?: boolean }).standalone;
        if (isIos) {
            setState("ios");
            return;
        }

        // Android/Chrome/Edge: the event may have already been captured by
        // PwaEventCapture in the root layout before this component mounted.
        if (window.__pwaPrompt) {
            deferredPrompt.current = window.__pwaPrompt;
            setState("available");
            return;
        }

        // Fallback: listen in case the event fires after this component mounts
        const handler = (e: Event) => {
            e.preventDefault();
            deferredPrompt.current = e as DeferredInstallPrompt;
            setState("available");
        };
        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    async function handleInstall() {
        if (!deferredPrompt.current) return;
        await deferredPrompt.current.prompt();
        const { outcome } = await deferredPrompt.current.userChoice;
        if (outcome === "accepted") {
            setState("installed");
            window.__pwaPrompt = undefined;
        }
        deferredPrompt.current = null;
    }

    if (state === "installed" || state === "idle") return null;

    if (state === "ios") {
        return (
            <>
                <Dropdown.Divider className="border-white opacity-25" />
                <Dropdown.Item
                    className="text-white bg-navy-secondary"
                    onClick={() => setShowIosModal(true)}
                >
                    <FontAwesomeIcon icon={faMobileScreenButton} className="me-2" />
                    {t('sidebar.installApp')}
                </Dropdown.Item>
                {/* Modal portals to document.body — safe to nest inside Dropdown.Menu */}
                <Modal show={showIosModal} onHide={() => setShowIosModal(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>{t('sidebar.installApp.ios.title')}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <ol className="mb-0">
                            <li className="mb-1">{t('sidebar.installApp.ios.step1')}</li>
                            <li className="mb-1">{t('sidebar.installApp.ios.step2')}</li>
                            <li>{t('sidebar.installApp.ios.step3')}</li>
                        </ol>
                    </Modal.Body>
                </Modal>
            </>
        );
    }

    // state === "available" — Android / Chrome / Edge
    return (
        <>
            <Dropdown.Divider className="border-white opacity-25" />
            <Dropdown.Item
                className="text-white bg-navy-secondary"
                onClick={handleInstall}
            >
                <FontAwesomeIcon icon={faDownload} className="me-2" />
                {t('sidebar.installApp')}
            </Dropdown.Item>
        </>
    );
}
