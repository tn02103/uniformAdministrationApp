import { AuthRole } from '@/lib/AuthRoles';
import '@testing-library/jest-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

window.HTMLElement.prototype.scrollIntoView = function () { };

// Mock i18n for component tests
const useI18nFn = jest.fn((key) => key);
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

// NextJS
jest.mock('next/navigation', () => ({
    useParams: jest.fn(),
    useRouter: jest.fn(),
}));

// Mock common components to avoid complex rendering
// Mock react-calendar
jest.mock('react-calendar', () => {
    return function MockCalendar({ onChange, minDate }: { onChange: (date: Date | null) => void; minDate?: Date }) {
        const handleDateClick = (day: number) => {
            const today = new Date();
            const selectedDate = new Date(today.getFullYear(), today.getMonth(), day);
            
            // Check if date is before minDate (compare dates only, not time)
            if (minDate) {
                const minDateOnly = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
                const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                
                if (selectedDateOnly < minDateOnly) {
                    return; // Don't call onChange for disabled dates
                }
            }
            
            onChange(selectedDate);
        };

        // Generate calendar days for current month
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const days = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(today.getFullYear(), today.getMonth(), day);
            let isDisabled = false;
            
            if (minDate) {
                const minDateOnly = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
                const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                isDisabled = dateOnly < minDateOnly;
            }
            
            days.push(
                <button
                    key={day}
                    type="button"
                    onClick={() => handleDateClick(day)}
                    disabled={isDisabled}
                    aria-label={`${day}`}
                >
                    {day}
                </button>
            );
        }

        return (
            <div data-testid="mock-calendar" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', padding: '10px', border: '1px solid #ccc', backgroundColor: 'white' }}>
                {days}
            </div>
        );
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
        changeLanguage: jest.fn(),
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

// Mock browser APIs that are not available in jsdom
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

// Mock toast notifications for component tests
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

jest.mock('usehooks-ts', () => ({
    useSessionStorage: jest.fn(() => [null, jest.fn()]),
}));