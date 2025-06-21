import { AuthRole } from '@/lib/AuthRoles';
import '@testing-library/jest-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const useI18nFn = jest.fn((key) => key);
window.HTMLElement.prototype.scrollIntoView = function () { };
jest.mock('@/lib/locales/client', () => {
    return {
        useScopedI18n: jest.fn((scope: string) => {
            return function (key: string) {
                return `${scope}.${key}`;
            };
        }),
        useI18n: jest.fn().mockImplementation(() => useI18nFn),
        useCurrentLocale: jest.fn(() => ({
            locale: 'de',
            setLocale: jest.fn(),
        })),
    };
});
jest.mock("@/components/errorMessage", () => {
    return function ErrorMessage({ error, ariaLabel, testId, ...divProps }: { error: string, testId: string, ariaLabel: string }) {
        return <div className="text-danger fs-7" role="alert" aria-label={ariaLabel} data-testid={testId} {...divProps}>{error}</div>;
    };
});

jest.mock("@/components/modals/modalProvider", () => {
    const modals = {
        dangerConfirmationModal: jest.fn(),
        simpleWarningModal: jest.fn(),
        simpleErrorModal: jest.fn(),
        simpleFormModal: jest.fn(),
        showMessageModal: jest.fn(),
    }
    return {
        useModal: jest.fn(() => modals)
    };
});

jest.mock("@/components/globalDataProvider", () => {
    return {
        useGlobalData: jest.fn(() => ({
            userRole: global.__ROLE__ ?? AuthRole.admin,
        })),
    };
});

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

jest.mock("react-toastify", () => {
    const toast = {
        success: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
    };
    return {
        toast
    };
});