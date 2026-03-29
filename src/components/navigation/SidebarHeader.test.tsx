import { fireEvent, render, screen } from "@testing-library/react";
import { SidebarHeader } from "./SidebarHeader";
import { useSidebarContext } from './Sidebar';
import { useInspectionState } from '@/dataFetcher/inspection';
import { useScopedI18n } from '@/lib/locales/client';


// Mock all dependencies
vi.mock('./Sidebar', () => ({
    useSidebarContext: vi.fn(),
}));

vi.mock('@/dataFetcher/inspection', () => ({
    useInspectionState: vi.fn(),
}));

const useScopedI18nFn = vi.hoisted(() => vi.fn());
vi.mock('@/lib/locales/client', () => {
    return {
        useScopedI18n: vi.fn((scope: string) => {
            useScopedI18nFn.mockImplementation((key: string) => `${scope}.${key}`);
            return useScopedI18nFn;
        }),
    };
});

const testAssosiation = {
    id: 'test-association',
    name: 'Test Association',
    acronym: "TA",
    useBeta: false,
};
const defaultSidebarContext = {
    isMobile: false,
    collapsed: false,
    isSidebarFixed: true,
    setShowSidebar: vi.fn(),
    setCollapsed: vi.fn(),
};

describe('SidebarHeader', () => {

    beforeEach(() => {
        vi.mocked(useSidebarContext).mockReturnValue({
            ...defaultSidebarContext,
            isSidebarFixed: true,
            setShowSidebar: vi.fn(),
        });
        vi.mocked(useInspectionState).mockReturnValue({
            inspectionState: {
                active: false,
                state: 'planned',
            },
        });

    });

    it('renders opend', () => {
        render(<SidebarHeader assosiation={testAssosiation} />);

        expect(screen.getByRole('link', { name: /homepage/i })).toBeInTheDocument();
        expect(screen.getByRole('link')).toHaveAttribute('href', '/');
        expect(screen.getByRole('link')).toHaveTextContent(testAssosiation.name);

        expect(screen.getByRole('button', { name: 'Close sidebar' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Close sidebar' })).toHaveClass('d-sm-none');
        expect(screen.queryByTestId('div_inspection')).not.toBeInTheDocument();
    });

    it('renders collapsed', () => {
        vi.mocked(useSidebarContext).mockReturnValue({
            ...defaultSidebarContext,
            collapsed: true,
            isSidebarFixed: false,
        });

        render(<SidebarHeader assosiation={testAssosiation} />);

        expect(screen.getByTestId('lnk_header')).toHaveTextContent(testAssosiation.name);
        expect(screen.getByTestId('lnk_header')).toHaveClass('sidebarHeaderTitleCollapsed');

        expect(screen.getByRole('button', { name: 'Close sidebar' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Close sidebar' })).toHaveClass('d-sm-none');
        expect(screen.queryByTestId('div_inspection')).not.toBeInTheDocument();
    });

    it('renders inspection active opend sidebar', () => {
        const t = useScopedI18n('sidebar.labels');
        vi.mocked(useInspectionState).mockReturnValue({
            inspectionState: {
                active: true,
                id: "inspection-1",
                date: "2024-01-01",
                state: 'active',
                inspectedCadets: 5,
                activeCadets: 10,
                deregistrations: 2,
            },
        });

        render(<SidebarHeader assosiation={testAssosiation} />);

        expect(screen.getByTestId('div_inspection')).toHaveTextContent('activeInspection.open');
        expect(t).toHaveBeenCalledWith('activeInspection.open', {
            controlled: 5,
            total: 8, // 10 - 2
        });
    });
    it('renders inspection active collapsed sidebar', () => {
        const t = useScopedI18n('sidebar.labels');
        vi.mocked(useSidebarContext).mockReturnValue({
            ...defaultSidebarContext,
            collapsed: true,
            isSidebarFixed: false,
        });
        vi.mocked(useInspectionState).mockReturnValue({
            inspectionState: {
                active: true,
                state: 'active',
                id: 'test-inspection-id',
                date: '2024-01-01',
                inspectedCadets: 3,
                activeCadets: 7,
                deregistrations: 1,
            },
        });

        render(<SidebarHeader assosiation={testAssosiation} />);

        expect(screen.getByTestId('div_inspection')).toHaveTextContent('activeInspection.collapsed');
        expect(t).toHaveBeenCalledWith('activeInspection.collapsed', {
            controlled: 3,
            total: 6, // 7 - 1
        });
    });

    it('prevents default on link click when collapsed', async () => {
        const setCollapsed = vi.fn();
        vi.mocked(useSidebarContext).mockReturnValue({
            ...defaultSidebarContext,
            collapsed: true,
            isSidebarFixed: false,
            setCollapsed,
        });
        render(<SidebarHeader assosiation={testAssosiation} />);

        const clickEvent = new MouseEvent('click', { bubbles: true });
        const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
        const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

        const link = screen.getByRole('link', { name: /homepage/i })
        fireEvent(link, clickEvent);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(stopPropagationSpy).toHaveBeenCalled();
        expect(setCollapsed).toHaveBeenCalledWith(false);
    });

    it('allows link click when not collapsed', async () => {
        const setCollapsed = vi.fn();
        vi.mocked(useSidebarContext).mockReturnValue({
            ...defaultSidebarContext,
            collapsed: false,
            isSidebarFixed: true,
            setCollapsed,
        });
        render(<SidebarHeader assosiation={testAssosiation} />);

        const clickEvent = new MouseEvent('click', { bubbles: true });
        const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
        const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

        const link = screen.getByRole('link', { name: /homepage/i });
        fireEvent(link, clickEvent);

        expect(preventDefaultSpy).not.toHaveBeenCalled();
        expect(stopPropagationSpy).not.toHaveBeenCalled();

        expect(setCollapsed).not.toHaveBeenCalled();
    });
});
