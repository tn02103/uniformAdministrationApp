import React from "react";
import { vi } from "vitest";
import { AuthRole } from "@/lib/AuthRoles";
import "@testing-library/jest-dom/vitest";

// ---- Jest compatibility shim ----
// _mockStore holds the mock objects for modules globally mocked in this setup
// file so that jest.requireMock(path) can retrieve them synchronously.
const _mockStore = new Map<string, unknown>();

(globalThis as Record<string, unknown>).jest = {
    ...vi,
    requireMock: (path: string) => {
        // Try the global-setup store first (covers setup-file mocks)
        const stored = _mockStore.get(path);
        if (stored !== undefined) return stored;
        // Fall back to Vitest's internal mock registry for test/helper-file mocks
        return (vi as unknown as Record<string, (p: string) => unknown>)['getMockedModule']?.(path);
    },
};

window.HTMLElement.prototype.scrollIntoView = function () { };

// --- i18n ---
const useI18nFn = vi.fn((key: string) => key);
const _locales_mock = {
    useScopedI18n: vi.fn((scope: string) => (key: string) => scope + "." + key),
    useI18n: vi.fn().mockImplementation(() => useI18nFn),
    useCurrentLocale: vi.fn(() => ({ locale: "de", setLocale: vi.fn() })),
};
vi.mock("@/lib/locales/client", () => _locales_mock);
_mockStore.set("@/lib/locales/client", _locales_mock);

// --- Next.js navigation ---
const _navigation_mock = { useParams: vi.fn(), useRouter: vi.fn() };
vi.mock("next/navigation", () => _navigation_mock);
_mockStore.set("next/navigation", _navigation_mock);

// --- modalProvider ---
const _modals_inner = {
    dangerConfirmationModal: vi.fn(),
    simpleWarningModal: vi.fn(),
    simpleErrorModal: vi.fn(),
    simpleFormModal: vi.fn(),
    showMessageModal: vi.fn(),
    changeLanguage: vi.fn(),
};
const _modals_mock = { useModal: vi.fn(() => _modals_inner) };
vi.mock("@/components/modals/modalProvider", () => _modals_mock);
_mockStore.set("@/components/modals/modalProvider", _modals_mock);

// --- globalDataProvider ---
const _globalData_mock = {
    useGlobalData: vi.fn(() => ({ userRole: global.__ROLE__ ?? AuthRole.admin })),
};
vi.mock("@/components/globalDataProvider", () => _globalData_mock);
_mockStore.set("@/components/globalDataProvider", _globalData_mock);

// --- react-toastify ---
const _toastify_mock = { toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() } };
vi.mock("react-toastify", () => _toastify_mock);
_mockStore.set("react-toastify", _toastify_mock);

// --- usehooks-ts ---
const _usehooks_mock = { useSessionStorage: vi.fn(() => [null, vi.fn()]) };
vi.mock("usehooks-ts", () => _usehooks_mock);
_mockStore.set("usehooks-ts", _usehooks_mock);

// --- errorMessage ---
vi.mock("@/components/errorMessage", () => ({
    default: function ErrorMessage({ error, ariaLabel, testId, ...divProps }: { error: string; testId: string; ariaLabel: string }) {
        return React.createElement("div", { className: "text-danger fs-7", role: "alert", "aria-label": ariaLabel, "data-testid": testId, ...divProps }, error);
    },
}));

// --- react-calendar ---
vi.mock("react-calendar", () => ({
    default: function MockCalendar({ onChange, minDate }: { onChange: (date: Date | null) => void; minDate?: Date }) {
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const days: React.ReactElement[] = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(today.getFullYear(), today.getMonth(), day);
            let isDisabled = false;
            if (minDate) {
                const minDateOnly = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
                isDisabled = date < minDateOnly;
            }
            days.push(React.createElement("button", {
                key: day, type: "button", disabled: isDisabled, "aria-label": String(day),
                onClick: () => {
                    if (!isDisabled) onChange(date);
                },
            }, day));
        }
        return React.createElement("div", { "data-testid": "mock-calendar" }, ...days);
    },
}));

// --- Browser APIs ---
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false, media: query, onchange: null,
        addListener: vi.fn(), removeListener: vi.fn(),
        addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
});
