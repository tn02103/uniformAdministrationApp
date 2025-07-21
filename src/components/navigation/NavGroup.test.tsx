import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import NavGroup from './NavGroup';
import { AuthRole } from '../../lib/AuthRoles';
import { useSidebarContext } from './Sidebar';
import { useGlobalData } from '../globalDataProvider';

// Mock the context hooks
jest.mock('./Sidebar', () => ({
    useSidebarContext: jest.fn(),
}));

jest.mock('../globalDataProvider', () => ({
    useGlobalData: jest.fn(),
}));

// Mock Bootstrap components
jest.mock('react-bootstrap', () => ({
    OverlayTrigger: ({ children, show, overlay }: { children: React.ReactNode, show?: boolean, overlay?: React.ReactNode }) => (
        <div data-testid="overlay-trigger" data-show={show}>
            {children}
            {show && <div data-testid="tooltip">{overlay}</div>}
        </div>
    ),
    Tooltip: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}));

const mockUseSidebarContext = useSidebarContext as jest.MockedFunction<typeof useSidebarContext>;
const mockUseGlobalData = useGlobalData as jest.MockedFunction<typeof useGlobalData>;

describe('NavGroup', () => {
    const defaultProps = {
        title: 'Test Group',
        icon: faGear,
        childSelected: false,
        requiredRole: AuthRole.user,
        children: <ul><li>Child Item</li></ul>,
        testId: 'test-nav-group',
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
    };

    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
        jest.clearAllMocks();
        user = userEvent.setup();
        mockUseSidebarContext.mockReturnValue(defaultSidebarContext);
        mockUseGlobalData.mockReturnValue(defaultGlobalData);
    });

    // Basic Rendering Tests
    describe('Basic Rendering', () => {
        test('Renders with required props', () => {
            render(<NavGroup {...defaultProps} />);

            expect(screen.getByTestId('test-nav-group')).toBeInTheDocument();
            expect(screen.getByText('Test Group')).toBeInTheDocument();
        });

        test('Displays title and icon correctly', () => {
            render(<NavGroup {...defaultProps} />);

            expect(screen.getByText('Test Group')).toBeInTheDocument();
            expect(screen.getAllByTestId('font-awesome-icon')[0]).toHaveAttribute('data-icon', 'gear');
        });

        test('Renders children when expanded', async () => {
            render(<NavGroup {...defaultProps} />);

            // Click to expand
            await user.click(screen.getByTestId('test-nav-group'));

            expect(screen.getByText('Child Item')).toBeInTheDocument();
        });
    });

    // Role-Based Access Control Tests
    describe('Role-Based Access Control', () => {
        test('Hides component for insufficient user role', () => {
            mockUseGlobalData.mockReturnValue({
                userRole: AuthRole.user,
                useBeta: false,
                sizelists: []
            });

            render(<NavGroup {...defaultProps} requiredRole={AuthRole.admin} />);

            expect(screen.queryByTestId('test-nav-group')).not.toBeInTheDocument();
        });

        test('Shows component for sufficient user role', () => {
            mockUseGlobalData.mockReturnValue({
                userRole: AuthRole.admin,
                useBeta: false,
                sizelists: []
            });

            render(<NavGroup {...defaultProps} requiredRole={AuthRole.user} />);

            expect(screen.getByTestId('test-nav-group')).toBeInTheDocument();
        });

        test('Tests different AuthRole scenarios', () => {
            // Test user role can access user-level component
            mockUseGlobalData.mockReturnValue({
                userRole: AuthRole.user,
                useBeta: false,
                sizelists: []
            });
            const { rerender } = render(<NavGroup {...defaultProps} requiredRole={AuthRole.user} />);
            expect(screen.getByTestId('test-nav-group')).toBeInTheDocument();

            // Test user role cannot access admin-level component
            rerender(<NavGroup {...defaultProps} requiredRole={AuthRole.admin} />);
            expect(screen.queryByTestId('test-nav-group')).not.toBeInTheDocument();

            // Test admin role can access all levels
            mockUseGlobalData.mockReturnValue({
                userRole: AuthRole.admin,
                useBeta: false,
                sizelists: []
            });
            rerender(<NavGroup {...defaultProps} requiredRole={AuthRole.admin} />);
            expect(screen.getByTestId('test-nav-group')).toBeInTheDocument();
        });
    });

    // Sidebar Context Integration Tests
    describe('Sidebar Context Integration', () => {
        test('Responds to collapsed state changes', async () => {
            const { rerender } = render(<NavGroup {...defaultProps} />);

            // Expand the group first
            await user.click(screen.getByTestId('test-nav-group'));
            expect(screen.getByText('Child Item')).toBeInTheDocument();

            // Simulate sidebar collapsing
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
            });

            rerender(<NavGroup {...defaultProps} />);

            // Children should be hidden when collapsed
            expect(screen.queryByText('Child Item')).not.toBeInTheDocument();
        });

        test('Calls setCollapsed when expanding group in collapsed sidebar', async () => {
            const mockSetCollapsed = jest.fn();
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
                setCollapsed: mockSetCollapsed,
            });

            render(<NavGroup {...defaultProps} />);

            await user.click(screen.getByTestId('test-nav-group'));

            expect(mockSetCollapsed).toHaveBeenCalledWith(false);
        });
    });

    // Interactive Behavior Tests
    describe('Interactive Behavior', () => {
        test('Toggles children on header click', async () => {
            render(<NavGroup {...defaultProps} />);

            const button = screen.getByTestId('test-nav-group');

            // Initially collapsed
            expect(screen.queryByText('Child Item')).not.toBeInTheDocument();

            // Click to expand
            await user.click(button);
            expect(screen.getByText('Child Item')).toBeInTheDocument();

            // Click to collapse
            await user.click(button);
            expect(screen.queryByText('Child Item')).not.toBeInTheDocument();
        });

        test('Handles rapid successive clicks', async () => {
            render(<NavGroup {...defaultProps} />);

            const button = screen.getByTestId('test-nav-group');

            // Rapid clicks
            await user.click(button);
            await user.click(button);
            await user.click(button);
            await user.click(button);

            // Should end up collapsed after even number of clicks
            expect(screen.queryByText('Child Item')).not.toBeInTheDocument();
        });
    });

    // State Management Tests
    describe('State Management', () => {
        test('Auto-expands when child is selected', async () => {
            const { rerender } = render(<NavGroup {...defaultProps} childSelected={false} />);

            // Initially no children shown
            expect(screen.queryByText('Child Item')).not.toBeInTheDocument();

            // Rerender with childSelected=true
            rerender(<NavGroup {...defaultProps} childSelected={true} />);

            await waitFor(() => {
                expect(screen.getByText('Child Item')).toBeInTheDocument();
            });
        });

        test('Auto-collapses when sidebar collapses', async () => {
            const { rerender } = render(<NavGroup {...defaultProps} />);

            // Expand the group
            await user.click(screen.getByTestId('test-nav-group'));
            expect(screen.getByText('Child Item')).toBeInTheDocument();

            // Simulate sidebar collapsing
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
            });

            // Force re-render by changing props
            rerender(<NavGroup {...defaultProps} />);

            await waitFor(() => {
                expect(screen.queryByText('Child Item')).not.toBeInTheDocument();
            });
        });

        test('Auto-expand when sidebar expands and child is selected', () => {
            // Start with collapsed sidebar and expanded group
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
            });

            const { rerender } = render(<NavGroup {...defaultProps} childSelected={true} />);
            expect(screen.queryByText('Child Item')).not.toBeInTheDocument();

            // Sidebar expands
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: false,
            });

            rerender(<NavGroup {...defaultProps} childSelected={true} />);

            // Should remain expanded due to childSelected
            expect(screen.getByText('Child Item')).toBeInTheDocument();
        });

        test('Initial state handling', () => {
            render(<NavGroup {...defaultProps} />);

            // Should start with children hidden (undefined state means collapsed)
            expect(screen.queryByText('Child Item')).not.toBeInTheDocument();
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
            expect(screen.queryByText('Test Group')).not.toBeInTheDocument();
        });

        test('Shows appropriate arrow icon', async () => {

            render(<NavGroup {...defaultProps} />);

            expect(screen.queryByText('Child Item')).not.toBeInTheDocument();
            expect(screen.getAllByTestId('font-awesome-icon')).toHaveLength(2);
            expect(screen.getAllByTestId('font-awesome-icon')[1]).toHaveAttribute('data-icon', 'angle-down');
            // Initially should show down arrow (collapsed state)
            await user.click(screen.getByTestId('test-nav-group'));

            expect(screen.getByText('Child Item')).toBeInTheDocument();
            expect(screen.getAllByTestId('font-awesome-icon')[1]).toHaveAttribute('data-icon', 'angle-up');
        });

        test('Highlights when child is selected', () => {
            render(<NavGroup {...defaultProps} childSelected={true} />);

            const button = screen.getByTestId('test-nav-group');
            expect(button.className).toContain('fw-bold');
        });
    });

    // Accessibility Tests
    describe('Accessibility', () => {
        test('Button is keyboard accessible', async () => {
            render(<NavGroup {...defaultProps} />);

            const button = screen.getByTestId('test-nav-group');

            // Focus the button and test keyboard interaction
            button.focus();
            expect(button).toHaveFocus();
            expect(screen.queryByText('Child Item')).not.toBeInTheDocument();
            // Test Enter key
            await user.keyboard('{Enter}');
            expect(screen.getByText('Child Item')).toBeInTheDocument();
        });

        test('Has proper ARIA attributes', () => {
            render(<NavGroup {...defaultProps} />);

            const button = screen.getByTestId('test-nav-group');
            expect(button).toHaveAttribute('type', 'button');
        });

        test('Screen reader compatibility', () => {
            render(<NavGroup {...defaultProps} />);

            // Test that important text is accessible
            expect(screen.getByText('Test Group')).toBeInTheDocument();
            expect(screen.getByRole('button')).toBeInTheDocument();
        });
    });
});
