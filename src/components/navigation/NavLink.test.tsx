import { faGear } from '@fortawesome/free-solid-svg-icons';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedFunction } from 'vitest';
import { AuthRole } from '../../lib/AuthRoles';
import { useGlobalData } from '../globalDataProvider';
import NavLink, { NavLinkProps } from './NavLink';
import { useSidebarContext } from './Sidebar';

// Mock the context hooks
vi.mock('./Sidebar', () => ({
    useSidebarContext: vi.fn(),
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
    default: function MockLink({ children, href, className, onClick, ...props }: React.ComponentProps<'a'>) {
        return (
            <a href={href} className={className} onClick={onClick} {...props}>
                {children}
            </a>
        );
    },
}));
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({
        push: vi.fn(),
    })),
    usePathname: vi.fn(() => '/test'),
    useParams: vi.fn(() => ({ locale: "de" })),
}));

// Mock Bootstrap components
vi.mock('react-bootstrap', () => ({
    OverlayTrigger: ({ children, show, overlay, delay }: { children: React.ReactNode, show?: boolean | undefined, overlay?: React.ReactNode, delay?: { show: number, hide: number } }) => (
        <div data-testid="overlay-trigger" data-show={show} data-delay={JSON.stringify(delay)}>
            {children}
            {show && <div data-testid="tooltip-overlay">{overlay}</div>}
        </div>
    ),
    Tooltip: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}));

const mockUseSidebarContext = useSidebarContext as MockedFunction<typeof useSidebarContext>;
const mockUseGlobalData = useGlobalData as MockedFunction<typeof useGlobalData>;

describe('NavLink', () => {
    const isRouteMock = vi.fn(() => false);
    const defaultProps = {
        text: 'Test Link',
        level: 1,
        item: {
            key: 'test-nav-link',
            isRoute: isRouteMock,
            href: 'test',
            icon: faGear,
            requiredRole: AuthRole.user,
        }
    } satisfies NavLinkProps;
    const getNavLinkProps = (itemOverrides?: Partial<NavLinkProps['item']>): NavLinkProps => {
        return {
            ...defaultProps,
            item: {
                ...defaultProps.item,
                ...itemOverrides,
            },
        };
    };


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

    beforeEach(() => {
        vi.clearAllMocks();
        user = userEvent.setup();
        mockUseSidebarContext.mockReturnValue(defaultSidebarContext);
        mockUseGlobalData.mockReturnValue(defaultGlobalData);
    });

    describe('Basic Rendering', () => {
        test('renders with required props', () => {
            render(<NavLink {...defaultProps} />);
            expect(screen.getByRole('listitem', { name: 'Test Link' })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: 'Test Link' })).toBeInTheDocument();
            expect(screen.getByText('Test Link')).toBeInTheDocument();
        });

        test('displays text correctly', () => {
            render(<NavLink {...defaultProps} text="Custom Text" />);
            expect(screen.getByText('Custom Text')).toBeInTheDocument();
        });

        test('renders icon when provided', () => {
            render(<NavLink {...getNavLinkProps({ icon: faGear })} />);
            const icon = screen.getByRole('img', { hidden: true });
            expect(icon).toBeInTheDocument();
            expect(icon).toHaveAttribute('data-icon', 'gear');
        });

        test('renders without icon when not provided', () => {
            render(<NavLink {...defaultProps} />);
            expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
        });
    });

    describe('Role-Based Access Control', () => {
        test('hides component for insufficient user role', () => {
            mockUseGlobalData.mockReturnValue({
                ...defaultGlobalData,
                userRole: AuthRole.user,
            });
            render(<NavLink {...getNavLinkProps({ requiredRole: AuthRole.admin })} />);
            expect(screen.queryByRole('listitem', { name: 'Test Link' })).not.toBeInTheDocument();
        });

        test('shows component for sufficient user role', () => {
            mockUseGlobalData.mockReturnValue({
                ...defaultGlobalData,
                userRole: AuthRole.admin,
            });
            render(<NavLink {...getNavLinkProps({ requiredRole: AuthRole.user })} />);
            expect(screen.getByRole('listitem', { name: 'Test Link' })).toBeInTheDocument();
        });
    });

    describe('Navigation Link', () => {
        test('renders Next.js Link with correct href', () => {
            render(<NavLink {...getNavLinkProps({ href: "custom-path" })} />);
            const link = screen.getByRole('link', { name: 'Test Link' });
            expect(link).toHaveAttribute('href', '/de/app/custom-path');
        });
    });

    describe('Styling and CSS Classes', () => {
        test('applies route styling when isRoute=true', () => {
            try {
                isRouteMock.mockReturnValue(true);
                render(<NavLink {...defaultProps} />);
                // Check for route-specific styling by looking for the list item element
                const listItem = screen.getByRole('listitem');
                expect(listItem).toHaveClass('fw-bold', 'bg-primary');
            } finally {
                isRouteMock.mockReturnValue(false);
            }
        });

        test('applies normal styling when isRoute=false', () => {
            isRouteMock.mockReturnValue(false);
            render(<NavLink {...defaultProps} />);
            // Check that route-specific styling is not applied
            const listItem = screen.getByRole('listitem');
            expect(listItem).not.toHaveClass('fw-bold', 'bg-primary');
        });
        test('applies collapsed styling', () => {
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
            });
            render(<NavLink {...defaultProps} />);
            const listItem = screen.getByRole('listitem');
            expect(listItem).toHaveClass('d-flex', 'justify-content-between');
        });

        test('applies level-based styling', () => {
            // Test level 2
            const { rerender } = render(<NavLink {...defaultProps} level={2} />);
            let listItem = screen.getByRole('listitem');
            expect(listItem).toHaveClass('fs-6', 'fw-light');

            // Test level 1
            rerender(<NavLink {...defaultProps} level={1} />);
            listItem = screen.getByRole('listitem');
            expect(listItem).toHaveClass('fs-6', 'my-1');

            // Test no level
            rerender(<NavLink {...defaultProps} />);
            listItem = screen.getByRole('listitem');
            expect(listItem).toHaveClass('fs-6', 'my-1');
        });

        test('applies correct font size classes', () => {
            // Test level 2 - should have fw-light
            const { rerender } = render(<NavLink {...defaultProps} level={2} />);
            let listItem = screen.getByRole('listitem');
            expect(listItem).toHaveClass('fs-6', 'fw-light');

            // Test level 1 - should have my-1
            rerender(<NavLink {...defaultProps} level={1} />);
            listItem = screen.getByRole('listitem');
            expect(listItem).toHaveClass('fs-6', 'my-1');
            expect(listItem).not.toHaveClass('fw-light');
        });
    });

    describe('Sidebar Context Integration', () => {
        test('responds to collapsed state changes', () => {
            const { rerender } = render(<NavLink {...defaultProps} />);

            // Initially expanded
            let overlayTrigger = screen.getByTestId('overlay-trigger');
            expect(overlayTrigger).toHaveAttribute('data-show', 'false');

            // Simulate sidebar collapsing
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
            });
            rerender(<NavLink {...defaultProps} />);

            overlayTrigger = screen.getByTestId('overlay-trigger');
            expect(overlayTrigger).not.toHaveAttribute('data-show');
        });

        test('calls setCollapsed when needed', async () => {
            const mockSetCollapsed = vi.fn();
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
                isSidebarFixed: false,
                isMobile: false,
                setCollapsed: mockSetCollapsed,
            });

            render(<NavLink {...defaultProps} />);
            const link = screen.getByRole('link');

            await user.click(link);
            expect(mockSetCollapsed).toHaveBeenCalledWith(false);
        });
        test('hides aria item when collapsed and level is 2', () => {
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
            });
            render(<NavLink {...defaultProps} level={2} />);
            const listItem = screen.getByRole('listitem', { hidden: true });
            expect(listItem).toHaveAttribute('aria-hidden', 'true');
        });
        test('does not hide aria item when collapsed and level is 1', () => {
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
            });
            render(<NavLink {...defaultProps} level={1} />);
            const listItem = screen.getByRole('listitem', { hidden: true });
            expect(listItem).toHaveAttribute('aria-hidden', "false");
        });
    });

    describe('Click Handling', () => {
        test('handles click on collapsed non-fixed sidebar', async () => {
            const mockSetCollapsed = vi.fn();
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
                isSidebarFixed: false,
                isMobile: false,
                setCollapsed: mockSetCollapsed,
            });

            render(<NavLink {...defaultProps} />);
            const link = screen.getByRole('link');

            const clickEvent = new MouseEvent('click', { bubbles: true });
            const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
            const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

            fireEvent(link, clickEvent);

            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(stopPropagationSpy).toHaveBeenCalled();
            expect(mockSetCollapsed).toHaveBeenCalledWith(false);
        });

        test('allows normal navigation on expanded sidebar', async () => {
            const mockSetCollapsed = vi.fn();
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: false,
                setCollapsed: mockSetCollapsed,
            });

            render(<NavLink {...defaultProps} />);
            const link = screen.getByRole('link');

            const clickEvent = new MouseEvent('click', { bubbles: true });
            const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
            const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

            fireEvent(link, clickEvent);

            expect(preventDefaultSpy).not.toHaveBeenCalled();
            expect(stopPropagationSpy).not.toHaveBeenCalled();
            expect(mockSetCollapsed).not.toHaveBeenCalled();
        });

        test('allows normal navigation on fixed sidebar', async () => {
            const mockSetCollapsed = vi.fn();
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
                isSidebarFixed: true,
                setCollapsed: mockSetCollapsed,
            });

            render(<NavLink {...defaultProps} />);
            const link = screen.getByRole('link');

            const clickEvent = new MouseEvent('click', { bubbles: true });
            const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
            const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

            fireEvent(link, clickEvent);

            expect(preventDefaultSpy).not.toHaveBeenCalled();
            expect(stopPropagationSpy).not.toHaveBeenCalled();
            expect(mockSetCollapsed).not.toHaveBeenCalled();
        });

        test('allows normal navigation on mobile', async () => {
            const mockSetCollapsed = vi.fn();
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
                isMobile: true,
                setCollapsed: mockSetCollapsed,
            });

            render(<NavLink {...defaultProps} />);
            const link = screen.getByRole('link');

            const clickEvent = new MouseEvent('click', { bubbles: true });
            const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
            const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

            fireEvent(link, clickEvent);

            expect(preventDefaultSpy).not.toHaveBeenCalled();
            expect(stopPropagationSpy).not.toHaveBeenCalled();
            expect(mockSetCollapsed).not.toHaveBeenCalled();
        });

        test('calls preventDefault and stopPropagation correctly', () => {
            const mockSetCollapsed = vi.fn();
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
                isSidebarFixed: false,
                isMobile: false,
                setCollapsed: mockSetCollapsed,
            });

            render(<NavLink {...defaultProps} />);
            const link = screen.getByRole('link');

            const mockEvent = new MouseEvent('click', { bubbles: true });
            const preventDefaultSpy = vi.spyOn(mockEvent, 'preventDefault');
            const stopPropagationSpy = vi.spyOn(mockEvent, 'stopPropagation');

            fireEvent(link, mockEvent);

            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(stopPropagationSpy).toHaveBeenCalled();
            expect(mockSetCollapsed).toHaveBeenCalledWith(false);
        });
        test('calls onNavigation correctly', async () => {
            const mockSetCollapsed = vi.fn();
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
                isSidebarFixed: true,
                setCollapsed: mockSetCollapsed,
            });

            const onNavigation = vi.fn();
            render(<NavLink {...defaultProps} onNavigation={onNavigation} />);

            const link = screen.getByRole('link');
            await userEvent.click(link);
            expect(onNavigation).toHaveBeenCalled();
        });
    });

    describe('Tooltip Integration', () => {
        test('shows tooltip when collapsed', () => {
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
            });
            render(<NavLink {...defaultProps} />);

            const overlayTrigger = screen.getByTestId('overlay-trigger');
            expect(overlayTrigger).not.toHaveAttribute('data-show');
        });

        test('hides tooltip when expanded', () => {
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: false,
            });
            render(<NavLink {...defaultProps} />);

            const overlayTrigger = screen.getByTestId('overlay-trigger');
            expect(overlayTrigger).toHaveAttribute('data-show', 'false');
        });

        test('tooltip displays correct text', () => {
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
            });
            render(<NavLink {...defaultProps} text="Custom Tooltip Text" />);

            expect(screen.getByText('Custom Tooltip Text')).toBeInTheDocument();
        });

        test('tooltip has correct delay settings', () => {
            render(<NavLink {...defaultProps} />);

            const overlayTrigger = screen.getByTestId('overlay-trigger');
            expect(overlayTrigger).toHaveAttribute('data-delay', '{"show":250,"hide":0}');
        });
    });

    describe('Icon Rendering', () => {
        test('FontAwesome icon props', () => {
            render(<NavLink {...getNavLinkProps({ icon: faGear })} />);

            const icon = screen.getByRole('img', { hidden: true });
            expect(icon).toHaveAttribute('data-icon', 'gear');
            expect(icon).toHaveAttribute('width', '20');
        });

        test('icon spacing in collapsed state', () => {
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
            });
            render(<NavLink {...getNavLinkProps({ icon: faGear })} />);

            const icon = screen.getByRole('img', { hidden: true });
            expect(icon).not.toHaveClass('pe-2');
        });

        test('icon spacing in expanded state', () => {
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: false,
            });
            render(<NavLink {...getNavLinkProps({ icon: faGear })} />);

            const icon = screen.getByRole('img', { hidden: true });
            expect(icon).toHaveClass('pe-2');
        });
    });
});
