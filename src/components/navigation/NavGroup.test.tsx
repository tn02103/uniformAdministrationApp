import { faGear } from '@fortawesome/free-solid-svg-icons';
import { fireEvent, getByRole, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname, useRouter } from 'next/navigation';
import { useSessionStorage } from 'usehooks-ts';
import { vi, type MockedFunction } from 'vitest';
import { AuthRole } from '../../lib/AuthRoles';
import { useGlobalData } from '../globalDataProvider';
import NavGroup from './NavGroup';
import { NavLinkProps } from './NavLink';
import { useSidebarContext } from './Sidebar';
import { NavbarGroup } from './SidebarTypes';

// Mock the context hooks
vi.mock('./Sidebar', () => ({
    useSidebarContext: vi.fn(),
}));

vi.mock('../globalDataProvider', () => ({
    useGlobalData: vi.fn(),
}));

vi.mock('next/navigation', () => {
    const router = {
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    };
    const usePathname = vi.fn(() => '/');
    return {
        useRouter: vi.fn(() => router),
        usePathname: usePathname,
        useParams: vi.fn(() => ({ locale: "de" }))
    }
});

vi.mock('usehooks-ts', () => {
    const useSessionStorage = vi.fn();
    return { useSessionStorage };
});

// Mock other components
vi.mock('./NavLink', () => ({
    default: ({ item, text, level, onNavigation }: NavLinkProps) => (
        <div data-testid={`nav-item-${item.key}`}>
            <button onClick={() => onNavigation?.(item.key)}>navigation</button>
            <span data-testid="nav-item-text">{text}</span>
            <span data-testid="nav-item-level">{level}</span>
        </div>
    ),
}));

// Mock Bootstrap components
vi.mock('react-bootstrap', () => ({
    OverlayTrigger: ({ children, show, overlay }: { children: React.ReactNode, show?: boolean, overlay?: React.ReactNode }) => (
        <div data-testid="overlay-trigger" data-show={show}>
            {children}
            {show && <div data-testid="tooltip">{overlay}</div>}
        </div>
    ),
    Tooltip: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}));

// Mock Data
const defaultGroup = {
    key: 'test-group',
    requiredRole: AuthRole.user,
    icon: faGear,
    links: [
        {
            key: 'child-item',
            href: 'child-item',
            defaultLink: true,
            isRoute: (pathname: string) => pathname.includes('child-item1'),
            requiredRole: AuthRole.user,
        },
        {
            key: 'another-child-item',
            href: 'another-child-item',
            defaultLink: false,
            isRoute: (pathname: string) => pathname.includes('another-child-item'),
            requiredRole: AuthRole.user,
        }
    ],
} satisfies NavbarGroup;

const defaultProps = {
    title: 'Test Group',
    item: defaultGroup,
};
const getProps = (overrides: Partial<NavbarGroup> | null, title?: string) => ({
    title: title ?? defaultProps.title,
    item: {
        ...defaultProps.item,
        ...overrides,
    }
});

const defaultSidebarContext = {
    collapsed: false,
    setCollapsed: vi.fn(),
    isSidebarFixed: false,
    isMobile: false,
    setShowSidebar: vi.fn(),
};

const defaultGlobalData = {
    userRole: AuthRole.admin,
    useBeta: false,
    sizelists: [],
    typeList: []
};

let user: ReturnType<typeof userEvent.setup>;
describe('NavGroup', () => {
    const router = vi.mocked(useRouter());
    const sessionStorage = vi.mocked(useSessionStorage);
    const pathnameMock = vi.mocked(usePathname);
    const mockUseSidebarContext = useSidebarContext as MockedFunction<typeof useSidebarContext>;
    const mockUseGlobalData = useGlobalData as MockedFunction<typeof useGlobalData>;

    beforeEach(() => {
        vi.clearAllMocks();
        user = userEvent.setup();
        mockUseSidebarContext.mockReturnValue(defaultSidebarContext);
        mockUseGlobalData.mockReturnValue(defaultGlobalData);
        pathnameMock.mockReturnValue('/');
        router.push.mockClear();
        router.replace.mockClear();
        sessionStorage.mockReturnValue([{ lastSelectedItem: null }, vi.fn(), vi.fn()]);
    });

    // Basic Rendering Tests
    test('renders correctly', () => {
        render(<NavGroup {...defaultProps} />);

        const listitem = screen.getByRole('listitem', { name: 'Navigation Group - Test Group' });
        expect(listitem).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Navigation Group - Test Group' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument();
        expect(screen.getByText('Test Group')).toBeInTheDocument();
        expect(screen.getAllByRole('img', { hidden: true })[0]).toHaveAttribute('data-icon', 'gear');
    });

    // Role-Based Access Control Tests
    describe('Role-Based Access Control', () => {
        test('Hides component for insufficient user role', () => {
            mockUseGlobalData.mockReturnValue({
                ...defaultGlobalData,
                userRole: AuthRole.user,
            });
            const props = getProps({ requiredRole: AuthRole.admin });

            render(<NavGroup {...props} />);

            expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
        });

        test('Shows component for sufficient user role', () => {
            mockUseGlobalData.mockReturnValue({
                ...defaultGlobalData,
                userRole: AuthRole.admin,
            });

            const props = getProps({ requiredRole: AuthRole.user });
            render(<NavGroup {...props} />);

            expect(screen.getByRole('listitem')).toBeInTheDocument();
        });
    });

    // Sidebar Context Integration Tests
    describe('Sidebar Context Integration', () => {
        test('Responds to collapsed state changes', async () => {
            const { rerender } = render(<NavGroup {...defaultProps} />);

            // Expand the group first
            await user.click(screen.getByRole('button', { name: 'Expand' }));
            screen.getByRole("listitem", { name: "Navigation Group - Test Group" });
            screen.getByRole("list", { name: "Child Links" });
            expect(screen.getByRole("list", { name: "Child Links" })).toBeVisible();

            // Simulate sidebar collapsing
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
            });

            rerender(<NavGroup {...defaultProps} />);

            // Children should be hidden when collapsed
            expect(screen.queryByRole("list", { name: "Child Links" })).toBeNull();
        });

        test('Calls setCollapsed when expanding group in collapsed sidebar', async () => {
            const mockSetCollapsed = vi.fn();
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
                setCollapsed: mockSetCollapsed,
            });

            render(<NavGroup {...defaultProps} />);

            await user.click(screen.getByRole('button', { name: 'Navigation Group - Test Group' }));

            expect(mockSetCollapsed).toHaveBeenCalledWith(false);
        });
    });

    // Interactive Behavior Tests
    describe('Interactive Behavior', () => {

        it('updates lastSelectedItem in sessionStorage on child navigation', async () => {
            const changeSessionStorage = vi.fn();
            sessionStorage.mockReturnValue([{ lastSelectedItem: null }, changeSessionStorage, vi.fn()]);
            render(<NavGroup {...defaultProps} />);

            await user.click(screen.getByRole('button', { name: 'Expand' }));
            const childItem = screen.getByTestId('nav-item-child-item');
            expect(childItem).toBeInTheDocument();
            const childItemButton = getByRole(childItem, 'button', { name: 'navigation' });
            await user.click(childItemButton);
            expect(changeSessionStorage).toHaveBeenCalledWith(expect.any(Function));
            const changeFunction = changeSessionStorage.mock.calls[0][0];
            const input = { someinput: "something", lastSelectedItem: 'another-child' };
            expect(changeFunction(input)).toEqual({ someinput: "something", lastSelectedItem: 'child-item' });
        });

        describe('Prefetch Behavior', () => {
            it('prefetches target-item on hover', async () => {
                render(<NavGroup {...defaultProps} />);
                await user.hover(screen.getByRole('button', { name: 'Navigation Group - Test Group' }));
                expect(router.prefetch).toHaveBeenCalledWith(expect.stringContaining('child-item'));
            });
            it('does not prefetch when childSelected is true', async () => {
                pathnameMock.mockReturnValue('/child-item1');
                render(<NavGroup {...defaultProps} />);
                await user.hover(screen.getByRole('button', { name: 'Navigation Group - Test Group' }));
                expect(router.prefetch).not.toHaveBeenCalled();
            });
            it('does not prefetch if group is expended', async () => {
                render(<NavGroup {...defaultProps} />);
                await user.click(screen.getByRole('button', { name: 'Expand' }));
                await user.hover(screen.getByRole('button', { name: 'Navigation Group - Test Group' }));
                expect(router.prefetch).not.toHaveBeenCalled();
            });
            it('does not prefetch on hover over the header arrow', async () => {
                render(<NavGroup {...defaultProps} />);
                await user.hover(screen.getByRole('button', { name: 'Expand' }));
                expect(router.prefetch).not.toHaveBeenCalled();
            });
        });

        describe('Header Arrow Click', () => {
            it('toggles children on click', async () => {
                render(<NavGroup {...defaultProps} />);

                expect(screen.queryByRole('list', { name: 'Child Links' })).toBeNull();
                const btn = screen.getByRole('button', { name: 'Expand' });
                expect(btn).toBeInTheDocument();
                await user.click(btn);
                expect(screen.getByRole('list', { name: 'Child Links' })).toBeInTheDocument();
                expect(btn).toHaveAttribute('aria-label', 'Collapse');
                expect(btn).toBeInTheDocument();
                await user.click(btn);
                expect(screen.queryByRole('list', { name: 'Child Links' })).toBeNull();
                expect(btn).toHaveAttribute('aria-label', 'Expand');
            });

            it('does not navigate', async () => {
                render(<NavGroup {...defaultProps} />);

                const btn = screen.getByRole('button', { name: 'Expand' });
                await user.click(btn);
                expect(btn).toHaveAttribute('aria-label', 'Collapse');
                await user.click(btn);
                expect(router.push).not.toHaveBeenCalled();
                expect(router.replace).not.toHaveBeenCalled();
            });
        });

        describe('Header Click', () => {
            it('toggles children on click', async () => {
                render(<NavGroup {...defaultProps} />);

                expect(screen.queryByRole('list', { name: 'Child Links' })).toBeNull();
                const btn = screen.getByRole('button', { name: 'Navigation Group - Test Group' });
                await user.click(btn);

                expect(screen.getByRole('list', { name: 'Child Links' })).toBeInTheDocument();
                await user.click(btn);
                expect(screen.queryByRole('list', { name: 'Child Links' })).toBeNull();
            });
            it('does not navigate when child-selected is true', async () => {
                pathnameMock.mockReturnValue('/child-item1');
                render(<NavGroup {...defaultProps} />);

                const btn = screen.getByRole('button', { name: 'Navigation Group - Test Group' });
                await user.click(btn);

                expect(router.push).not.toHaveBeenCalled();
                expect(router.replace).not.toHaveBeenCalled();
            });
            it('does not navigate when click is a touch-event', async () => {
                render(<NavGroup {...defaultProps} />);

                const btn = screen.getByRole('button', { name: 'Navigation Group - Test Group' });
                fireEvent.touchStart(btn);
                fireEvent.touchEnd(btn);

                expect(router.push).not.toHaveBeenCalled();
                expect(router.replace).not.toHaveBeenCalled();
            });
            it('does not navigate when group is expanded', async () => {
                render(<NavGroup {...defaultProps} />);

                const btn = screen.getByRole('button', { name: 'Expand' });
                await user.click(btn);
                await expect(screen.getByRole('list', { name: 'Child Links' })).toBeInTheDocument();
                await expect(btn).toHaveAttribute('aria-label', 'Collapse');
                await user.click(screen.getByRole('button', { name: 'Navigation Group - Test Group' }));

                expect(router.push).not.toHaveBeenCalled();
                expect(router.replace).not.toHaveBeenCalled();
            });
            it('does navigate otherwise', async () => {
                render(<NavGroup {...defaultProps} />);

                await user.click(screen.getByRole('button', { name: 'Navigation Group - Test Group' }));
                expect(router.push).toHaveBeenCalled();
                expect(router.push).toHaveBeenCalledWith("/de/app/child-item");
            });
            it('navigates to lastSelectedItem if it exists', async () => {
                sessionStorage.mockReturnValue([{ lastSelectedItem: defaultGroup.links[1].key }, vi.fn(), vi.fn()]);
                render(<NavGroup {...defaultProps} />);

                await user.click(screen.getByRole('button', { name: 'Navigation Group - Test Group' }));
                expect(router.push).toHaveBeenCalled();
                expect(router.push).toHaveBeenCalledWith("/de/app/another-child-item");
            });
            it('navigates to default link if lastSelectedItem does not exist', async () => {
                sessionStorage.mockReturnValue([{ lastSelectedItem: null }, vi.fn(), vi.fn()]);
                render(<NavGroup {...defaultProps} />);

                await user.click(screen.getByRole('button', { name: 'Navigation Group - Test Group' }));
                expect(router.push).toHaveBeenCalled();
                expect(router.push).toHaveBeenCalledWith("/de/app/child-item");
            });
            it('navigates to default link if lastSelectedItem is invalid', async () => {
                sessionStorage.mockReturnValue([{ lastSelectedItem: 'invalid-key' }, vi.fn(), vi.fn()]);
                render(<NavGroup {...defaultProps} />);

                await user.click(screen.getByRole('button', { name: 'Navigation Group - Test Group' }));
                expect(router.push).toHaveBeenCalled();
                expect(router.push).toHaveBeenCalledWith("/de/app/child-item");
            });
            it('navigates to first link if no lastSelectedItem and no default link', async () => {
                const group = { ...defaultGroup };
                sessionStorage.mockReturnValue([{ lastSelectedItem: null }, vi.fn(), vi.fn()]);

                group.links[0].defaultLink = false;
                render(<NavGroup {...defaultProps} item={group} />);

                await user.click(screen.getByRole('button', { name: 'Navigation Group - Test Group' }));
                expect(router.push).toHaveBeenCalled();
                expect(router.push).toHaveBeenCalledWith("/de/app/child-item");
            });
            it('does not navigate if no target item is found', async () => {
                sessionStorage.mockReturnValue([{ lastSelectedItem: 'non-existent-key' }, vi.fn(), vi.fn()]);
                const group = { ...defaultGroup };
                group.links = [];
                render(<NavGroup {...defaultProps} item={group} />);

                await user.click(screen.getByRole('button', { name: 'Navigation Group - Test Group' }));
                expect(router.push).not.toHaveBeenCalled();
            });
        });
    });


    // State Management Tests
    describe('State Management', () => {
        test('Auto-expands when child is selected', async () => {
            const { rerender } = render(<NavGroup {...defaultProps} />);

            // Initially no children shown
            expect(screen.queryByText('Child Item')).not.toBeInTheDocument();

            // Rerender with childSelected=true
            pathnameMock.mockReturnValue('child-item1');
            rerender(<NavGroup {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByRole('list', { name: 'Child Links' })).toBeInTheDocument();
            });
        });

        test('Auto-collapses when sidebar collapses', async () => {
            const { rerender } = render(<NavGroup {...defaultProps} />);

            // Expand the group
            await user.click(screen.getByRole('button', { name: 'Expand' }));
            expect(screen.getByRole('list', { name: 'Child Links' })).toBeInTheDocument();

            // Simulate sidebar collapsing
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
            });

            // Force re-render by changing props
            rerender(<NavGroup {...defaultProps} />);

            await waitFor(() => {
                expect(screen.queryByRole('list', { name: 'Child Links' })).not.toBeInTheDocument();
            });
        });

        test('Auto-expand when sidebar expands and child is selected', () => {
            // Start with collapsed sidebar and expanded group
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
            });

            pathnameMock.mockReturnValue('child-item1');
            const { rerender } = render(<NavGroup {...defaultProps} />);
            expect(screen.queryByRole('list', { name: 'Child Links' })).not.toBeInTheDocument();

            // Sidebar expands
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: false,
            });

            rerender(<NavGroup {...defaultProps} />);

            // Should remain expanded due to childSelected
            expect(screen.getByRole('list', { name: 'Child Links' })).toBeInTheDocument();
        });

        test('Initial state no child selected', () => {
            render(<NavGroup {...defaultProps} />);

            // Should start with children hidden (undefined state means collapsed)
            expect(screen.queryByRole('list', { name: 'Child Links' })).not.toBeInTheDocument();
        });
        test('initial state with child selected', () => {
            pathnameMock.mockReturnValue('child-item1');
            render(<NavGroup {...defaultProps} />);
            expect(screen.getByRole('list', { name: 'Child Links' })).toBeInTheDocument();
        });
    });

    // Visual State Tests
    describe('Visual State', () => {
        test('Applies correct styling for collapsed state', () => {
            const { rerender } = render(<NavGroup {...defaultProps} />);
            expect(screen.getByText('Test Group')).toBeInTheDocument();

            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
            });
            rerender(<NavGroup {...defaultProps} />);
            expect(screen.queryByText('Test Group')).toBeNull();
            expect(screen.queryByRole('button', { name: /(expand)|(collapse)/i })).toBeNull();
            expect(screen.queryByRole('list', { name: 'Child Links' })).toBeNull();
            expect(screen.getAllByRole('img', { hidden: true })[0]).toBeVisible();
            expect(screen.getAllByRole('img', { hidden: true })[0]).toHaveAttribute('data-icon', 'gear');
        });

        test('Shows appropriate arrow icon', async () => {
            render(<NavGroup {...defaultProps} />);

            expect(screen.queryByRole('list', { name: 'Child Links' })).not.toBeInTheDocument();
            expect(screen.getAllByRole('img', { hidden: true })).toHaveLength(2);
            expect(screen.getAllByRole('img', { hidden: true })[1]).toHaveAttribute('data-icon', 'angle-down');
            // Initially should show down arrow (collapsed state)
            await user.click(screen.getByRole('button', { name: /expand/i }));

            expect(screen.getByRole('list', { name: 'Child Links' })).toBeInTheDocument();
            expect(screen.getAllByRole('img', { hidden: true })[1]).toHaveAttribute('data-icon', 'angle-up');
        });
    });
});
