/**
 * Viewport utilities for handling dynamic viewport height on mobile devices
 * Addresses the issue where mobile browser UI (address bar, etc.) changes viewport height
 */

/**
 * Sets a CSS custom property for the actual viewport height
 * This addresses the mobile browser viewport height issue where 100vh doesn't account
 * for the dynamic browser UI (address bar showing/hiding)
 */
export function setViewportHeight(): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return;

    // Detect browser and device
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

    let actualHeight = window.innerHeight;

    // For Chrome mobile, use a more aggressive approach
    if (isChrome && isMobile) {
        // Try Visual Viewport API first (most accurate for Chrome)
        if (window.visualViewport) {
            actualHeight = window.visualViewport.height;
        } else {
            // For Chrome mobile without Visual Viewport API
            // Use screen height as it's often more reliable
            actualHeight = Math.max(window.innerHeight, window.screen.height * 0.85);
        }
    } else if (isIOS) {
        // iOS Safari specific handling
        if (window.visualViewport) {
            actualHeight = window.visualViewport.height;
        } else {
            // iOS fallback
            actualHeight = window.innerHeight;
        }
    }

    // Set CSS custom properties
    const vh = actualHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    document.documentElement.style.setProperty('--app-height', `${actualHeight}px`);

    // Force a more aggressive height for Chrome mobile if it seems too short
    if (isChrome && isMobile && actualHeight < window.screen.height * 0.7) {
        const forcedHeight = window.screen.height * 0.92; // 92% of screen height
        document.documentElement.style.setProperty('--app-height', `${forcedHeight}px`);
    }

    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
        console.info('Viewport Debug:', {
            browser: isChrome ? 'Chrome' : 'Other',
            isMobile,
            windowHeight: window.innerHeight,
            screenHeight: window.screen.height,
            visualViewportHeight: window.visualViewport?.height,
            calculatedHeight: actualHeight,
            appHeight: document.documentElement.style.getPropertyValue('--app-height')
        });
    }
}

/**
 * Initialize viewport height handling
 * Call this once when your app initializes
 */
export function initViewportHeight(): (() => void) | void {
    if (typeof window === 'undefined') return;

    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

    // Set initial height
    setViewportHeight();

    // For Chrome mobile, be more aggressive with updates
    const updateDelay = isChrome && isMobile ? 50 : 100;

    // Update on resize (throttled)
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(setViewportHeight, updateDelay);
    };

    // Visual viewport handler
    const handleVisualViewportChange = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(setViewportHeight, 25); // Very fast response
    };

    // Regular resize event
    window.addEventListener('resize', handleResize);

    // Orientation change
    if ('orientation' in window) {
        const handleOrientationChange = () => {
            // Multiple attempts for orientation change
            setTimeout(setViewportHeight, 100);
        };
        window.addEventListener('orientationchange', handleOrientationChange);
    }

    // Visual viewport API (especially important for Chrome)
    if ('visualViewport' in window && window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    }

    // Chrome mobile: additional events
    let focusHandler: (() => void) | undefined;
    let intervalId: NodeJS.Timeout | undefined;

    if (isChrome && isMobile) {

        // Handle focus events (virtual keyboard, address bar)
        focusHandler = () => {
            setTimeout(setViewportHeight, 200);
        };
        window.addEventListener('focus', focusHandler);
        window.addEventListener('blur', focusHandler);

        // Periodic check for Chrome mobile (fallback)
        intervalId = setInterval(setViewportHeight, 2000);
    }

    // Return cleanup function
    return () => {
        window.removeEventListener('resize', handleResize);
        if ('orientation' in window) {
            window.removeEventListener('orientationchange', setViewportHeight);
        }
        if ('visualViewport' in window && window.visualViewport) {
            window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
        }
        if (focusHandler) {
            window.removeEventListener('focus', focusHandler);
            window.removeEventListener('blur', focusHandler);
        }
        if (intervalId) {
            clearInterval(intervalId);
        }
        clearTimeout(timeoutId);
    };
}

