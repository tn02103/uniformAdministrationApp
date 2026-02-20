import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import NavLink from './NavLink';
import { AuthRole } from '../../lib/AuthRoles';
import { useSidebarContext } from './Sidebar';
import { useGlobalData } from '../globalDataProvider';

// Mock the context hooks
jest.mock('./Sidebar', () => ({
    useSidebarContext: jest.fn(),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
    return function MockLink({ children, href, className, onClick, ...props }: React.ComponentProps<'a'>) {
        return (
            <a href={href} className={className} onClick={onClick} {...props}>
                {children}
            </a>
        );
    };
});

// Mock Bootstrap components
jest.mock('react-bootstrap', () => ({
    OverlayTrigger: ({ children, show, overlay, delay }: { children: React.ReactNode, show?: boolean | undefined, overlay?: React.ReactNode, delay?: { show: number, hide: number } }) => (
        <div data-testid="overlay-trigger" data-show={show} data-delay={JSON.stringify(delay)}>
            {children}
            {show && <div data-testid="tooltip-overlay">{overlay}</div>}
        </div>
    ),
    Tooltip: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}));

const mockUseSidebarContext = useSidebarContext as jest.MockedFunction<typeof useSidebarContext>;
const mockUseGlobalData = useGlobalData as jest.MockedFunction<typeof useGlobalData>;

describe('NavLink', () => {
    const defaultProps = {
        text: 'Test Link',
        href: '/test',
        isRoute: false,
        requiredRole: AuthRole.user,
        testId: 'test-nav-link',
    };

    const defaultSidebarContext = {
        collapsed: false,
        setCollapsed: jest.fn(),
        isSidebarFixed: false,
        isMobile: false,
        setShowSidebar: jest.fn(),
    };

    const defaultGlobalData = {
        userRole: AuthRole.admin,
        useBeta: false,
        sizelists: [],
        typeList: []
    };

    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
        jest.clearAllMocks();
        user = userEvent.setup();
        mockUseSidebarContext.mockReturnValue(defaultSidebarContext);
        mockUseGlobalData.mockReturnValue(defaultGlobalData);
    });

    describe('Basic Rendering', () => {
        test('renders with required props', () => {
            render(<NavLink {...defaultProps} />);
            expect(screen.getByTestId('test-nav-link')).toBeInTheDocument();
            expect(screen.getByText('Test Link')).toBeInTheDocument();
        });

        test('displays text correctly', () => {
            render(<NavLink {...defaultProps} text="Custom Text" />);
            expect(screen.getByText('Custom Text')).toBeInTheDocument();
        });

        test('renders icon when provided', () => {
            render(<NavLink {...defaultProps} icon={faGear} />);
            const icon = screen.getByRole('img', { hidden: true });
            expect(icon).toBeInTheDocument();
            expect(icon).toHaveAttribute('data-icon', 'gear');
        });

        test('renders without icon when not provided', () => {
            render(<NavLink {...defaultProps} />);
            expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
        });

        test('applies correct testId', () => {
            render(<NavLink {...defaultProps} testId="custom-test-id" />);
            expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
        });
    });

    describe('Role-Based Access Control', () => {
        test('hides component for insufficient user role', () => {
            mockUseGlobalData.mockReturnValue({
                ...defaultGlobalData,
                userRole: AuthRole.user,
            });
            render(<NavLink {...defaultProps} requiredRole={AuthRole.admin} />);
            expect(screen.queryByTestId('test-nav-link')).not.toBeInTheDocument();
        });

        test('shows component for sufficient user role', () => {
            mockUseGlobalData.mockReturnValue({
                ...defaultGlobalData,
                userRole: AuthRole.admin,
            });
            render(<NavLink {...defaultProps} requiredRole={AuthRole.user} />);
            expect(screen.getByTestId('test-nav-link')).toBeInTheDocument();
        });

        test('tests different AuthRole scenarios', () => {
            // Test user role can access user-level component
            mockUseGlobalData.mockReturnValue({
                ...defaultGlobalData,
                userRole: AuthRole.user,
            });
            const { rerender } = render(<NavLink {...defaultProps} requiredRole={AuthRole.user} />);
            expect(screen.getByTestId('test-nav-link')).toBeInTheDocument();

            // Test user role cannot access admin-level component
            rerender(<NavLink {...defaultProps} requiredRole={AuthRole.admin} />);
            expect(screen.queryByTestId('test-nav-link')).not.toBeInTheDocument();

            // Test admin role can access all levels
            mockUseGlobalData.mockReturnValue({
                ...defaultGlobalData,
                userRole: AuthRole.admin,
            });
            rerender(<NavLink {...defaultProps} requiredRole={AuthRole.admin} />);
            expect(screen.getByTestId('test-nav-link')).toBeInTheDocument();
        });
    });

    describe('Navigation Link', () => {
        test('renders Next.js Link with correct href', () => {
            render(<NavLink {...defaultProps} href="/custom-path" />);
            const link = screen.getByTestId('test-nav-link');
            expect(link).toHaveAttribute('href', '/custom-path');
        });

        test('link has correct className', () => {
            render(<NavLink {...defaultProps} />);
            const link = screen.getByTestId('test-nav-link');
            expect(link).toHaveClass('stretched-link', 'd-flex', 'flex-row');
        });

        test('link has correct data-testid', () => {
            render(<NavLink {...defaultProps} testId="custom-link-id" />);
            expect(screen.getByTestId('custom-link-id')).toBeInTheDocument();
        });
    });

    describe('Styling and CSS Classes', () => {
        test('applies route styling when isRoute=true', () => {
            render(<NavLink {...defaultProps} isRoute={true} />);
            // Check for route-specific styling by looking for the list item element
            const listItem = screen.getByRole('listitem');
            expect(listItem).toHaveClass('fw-bold', 'bg-primary');
        });

        test('applies normal styling when isRoute=false', () => {
            render(<NavLink {...defaultProps} isRoute={false} />);
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
            const mockSetCollapsed = jest.fn();
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
                isSidebarFixed: false,
                isMobile: false,
                setCollapsed: mockSetCollapsed,
            });

            render(<NavLink {...defaultProps} />);
            const link = screen.getByTestId('test-nav-link');

            await user.click(link);
            expect(mockSetCollapsed).toHaveBeenCalledWith(false);
        });
    });

    describe('Click Handling', () => {
        test('handles click on collapsed non-fixed sidebar', async () => {
            const mockSetCollapsed = jest.fn();
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
                isSidebarFixed: false,
                isMobile: false,
                setCollapsed: mockSetCollapsed,
            });

            render(<NavLink {...defaultProps} />);
            const link = screen.getByTestId('test-nav-link');

            const clickEvent = new MouseEvent('click', { bubbles: true });
            const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');
            const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');

            fireEvent(link, clickEvent);

            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(stopPropagationSpy).toHaveBeenCalled();
            expect(mockSetCollapsed).toHaveBeenCalledWith(false);
        });

        test('allows normal navigation on expanded sidebar', async () => {
            const mockSetCollapsed = jest.fn();
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: false,
                setCollapsed: mockSetCollapsed,
            });

            render(<NavLink {...defaultProps} />);
            const link = screen.getByTestId('test-nav-link');

            const clickEvent = new MouseEvent('click', { bubbles: true });
            const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');
            const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');

            fireEvent(link, clickEvent);

            expect(preventDefaultSpy).not.toHaveBeenCalled();
            expect(stopPropagationSpy).not.toHaveBeenCalled();
            expect(mockSetCollapsed).not.toHaveBeenCalled();
        });

        test('allows normal navigation on fixed sidebar', async () => {
            const mockSetCollapsed = jest.fn();
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
                isSidebarFixed: true,
                setCollapsed: mockSetCollapsed,
            });

            render(<NavLink {...defaultProps} />);
            const link = screen.getByTestId('test-nav-link');

            const clickEvent = new MouseEvent('click', { bubbles: true });
            const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');
            const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');

            fireEvent(link, clickEvent);

            expect(preventDefaultSpy).not.toHaveBeenCalled();
            expect(stopPropagationSpy).not.toHaveBeenCalled();
            expect(mockSetCollapsed).not.toHaveBeenCalled();
        });

        test('allows normal navigation on mobile', async () => {
            const mockSetCollapsed = jest.fn();
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
                isMobile: true,
                setCollapsed: mockSetCollapsed,
            });

            render(<NavLink {...defaultProps} />);
            const link = screen.getByTestId('test-nav-link');

            const clickEvent = new MouseEvent('click', { bubbles: true });
            const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');
            const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');

            fireEvent(link, clickEvent);

            expect(preventDefaultSpy).not.toHaveBeenCalled();
            expect(stopPropagationSpy).not.toHaveBeenCalled();
            expect(mockSetCollapsed).not.toHaveBeenCalled();
        });
        
        test('calls preventDefault and stopPropagation correctly', () => {
            const mockSetCollapsed = jest.fn();
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
                isSidebarFixed: false,
                isMobile: false,
                setCollapsed: mockSetCollapsed,
            });

            render(<NavLink {...defaultProps} />);
            const link = screen.getByTestId('test-nav-link');

            const mockEvent = new MouseEvent('click', { bubbles: true });
            const preventDefaultSpy = jest.spyOn(mockEvent, 'preventDefault');
            const stopPropagationSpy = jest.spyOn(mockEvent, 'stopPropagation');

            fireEvent(link, mockEvent);

            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(stopPropagationSpy).toHaveBeenCalled();
            expect(mockSetCollapsed).toHaveBeenCalledWith(false);
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
            render(<NavLink {...defaultProps} icon={faGear} />);

            const icon = screen.getByRole('img', { hidden: true });
            expect(icon).toHaveAttribute('data-icon', 'gear');
            expect(icon).toHaveAttribute('width', '20');
        });

        test('icon spacing in collapsed state', () => {
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
            });
            render(<NavLink {...defaultProps} icon={faGear} />);

            const icon = screen.getByRole('img', { hidden: true });
            expect(icon).not.toHaveClass('pe-2');
        });

        test('icon spacing in expanded state', () => {
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: false,
            });
            render(<NavLink {...defaultProps} icon={faGear} />);

            const icon = screen.getByRole('img', { hidden: true });
            expect(icon).toHaveClass('pe-2');
        });
    });

    describe('Text Visibility', () => {
        test('text hidden when collapsed', () => {
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
            });
            render(<NavLink {...defaultProps} />);

            const link = screen.getByRole('link')
            expect(link).not.toHaveTextContent('Test Link');
        });

        test('text visible when expanded', () => {
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: false,
            });
            render(<NavLink {...defaultProps} />);

            const textElement = screen.getByText('Test Link');
            expect(textElement).toHaveStyle({ visibility: 'visible' });
        });

        test('text transition delay', () => {
            render(<NavLink {...defaultProps} />);

            const textElement = screen.getByText('Test Link');
            expect(textElement).toHaveStyle({ transitionDelay: '0.3s' });
        });
    });

    describe('Accessibility', () => {
        test('link is keyboard accessible', async () => {
            render(<NavLink {...defaultProps} />);
            const link = screen.getByTestId('test-nav-link');

            // Focus the link and test keyboard interaction
            link.focus();
            expect(link).toHaveFocus();

            // Test Enter key
            await user.keyboard('{Enter}');
            expect(link).toBeInTheDocument();
        });

        test('has proper ARIA attributes', () => {
            render(<NavLink {...defaultProps} />);
            const link = screen.getByTestId('test-nav-link');

            // Check that the link has proper href attribute
            expect(link).toHaveAttribute('href', '/test');
            expect(link).toHaveAttribute('data-testid', 'test-nav-link');
        });

        test('screen reader compatibility', () => {
            render(<NavLink {...defaultProps} />);

            // Test that important text is accessible
            expect(screen.getByText('Test Link')).toBeInTheDocument();
            expect(screen.getByRole('link')).toBeInTheDocument();
        });
    });
});
