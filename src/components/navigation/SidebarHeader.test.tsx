import { fireEvent, render, screen } from "@testing-library/react";
import { SidebarHeader } from "./SidebarHeader";

// Mock all dependencies
jest.mock('./Sidebar', () => ({
    useSidebarContext: jest.fn(),
}));

jest.mock('@/dataFetcher/inspection', () => ({
    useInspectionState: jest.fn(),
}));

const useScopedI18nFn = jest.fn();
jest.mock('@/lib/locales/client', () => {
    return {
        useScopedI18n: jest.fn((scope: string) => {
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
    setShowSidebar: jest.fn(),
    setCollapsed: jest.fn(),
};

describe('SidebarHeader', () => {
    const { useSidebarContext } = jest.requireMock('./Sidebar');
    const { useInspectionState } = jest.requireMock('@/dataFetcher/inspection');
    const { useScopedI18n } = jest.requireMock('@/lib/locales/client');

    beforeEach(() => {
        useSidebarContext.mockReturnValue({
            ...defaultSidebarContext,
            isSidebarFixed: true,
            setShowSidebar: jest.fn(),
        });
        useInspectionState.mockReturnValue({
            inspectionState: {
                active: false,
                inspectedCadets: 0,
                activeCadets: 0,
                deregistrations: 0,
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
        useSidebarContext.mockReturnValue({
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
        useInspectionState.mockReturnValue({
            inspectionState: {
                active: true,
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
        useSidebarContext.mockReturnValue({
            ...defaultSidebarContext,
            collapsed: true,
            isSidebarFixed: false,
        });
        useInspectionState.mockReturnValue({
            inspectionState: {
                active: true,
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
        const setCollapsed = jest.fn();
        useSidebarContext.mockReturnValue({
            ...defaultSidebarContext,
            collapsed: true,
            isSidebarFixed: false,
            setCollapsed,
        });
        render(<SidebarHeader assosiation={testAssosiation} />);

        const clickEvent = new MouseEvent('click', { bubbles: true });
        const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');
        const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');

        const link = screen.getByRole('link', { name: /homepage/i })
        fireEvent(link, clickEvent);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(stopPropagationSpy).toHaveBeenCalled();
        expect(setCollapsed).toHaveBeenCalledWith(false);
    });

    it('allows link click when not collapsed', async () => {
        const setCollapsed = jest.fn();
        useSidebarContext.mockReturnValue({
            ...defaultSidebarContext,
            collapsed: false,
            isSidebarFixed: true,
            setCollapsed,
        });
        render(<SidebarHeader assosiation={testAssosiation} />);

        const clickEvent = new MouseEvent('click', { bubbles: true });
        const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');
        const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');

        const link = screen.getByRole('link', { name: /homepage/i });
        fireEvent(link, clickEvent);

        expect(preventDefaultSpy).not.toHaveBeenCalled();
        expect(stopPropagationSpy).not.toHaveBeenCalled();

        expect(setCollapsed).not.toHaveBeenCalled();
    });
});
