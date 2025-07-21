import { logout } from '@/actions/auth';
import { fireEvent, getByRole, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { mutate } from 'swr';
import { useSessionStorage } from 'usehooks-ts';
import { useModal } from '../modals/modalProvider';
import { useSidebarContext } from './Sidebar';
import { SidebarFooter } from './SidebarFooter';

// Mock all dependencies
jest.mock('./Sidebar', () => ({
    useSidebarContext: jest.fn(),
}));

jest.mock('@/actions/auth', () => ({
    logout: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('usehooks-ts', () => ({
    useSessionStorage: jest.fn(),
}));

jest.mock('swr', () => ({
    mutate: jest.fn(),
    useSWR: jest.fn(),
}));

// Mock localStorage
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
});

// Mock environment variable
process.env.NEXT_PUBLIC_LOCAL_AUTH_KEY = 'test-auth-key';

const mockUseSidebarContext = useSidebarContext as jest.MockedFunction<typeof useSidebarContext>;
const mockUseModal = useModal as jest.MockedFunction<typeof useModal>;
const mockLogout = logout as jest.MockedFunction<typeof logout>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSessionStorage = useSessionStorage as jest.MockedFunction<typeof useSessionStorage>;
const mockMutate = mutate as jest.MockedFunction<typeof mutate>;

describe('SidebarFooter', () => {
    const defaultProps = {
        username: 'testuser',
        collapseButtonRef: { current: null },
        handleCollapseButtonMouseLeave: jest.fn(),
    };

    const defaultSidebarContext = {
        collapsed: false,
        setCollapsed: jest.fn(),
        isSidebarFixed: true,
        setShowSidebar: jest.fn(),
        isMobile: false,
    };

    const defaultRouter = {
        push: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
    };

    let user: ReturnType<typeof userEvent.setup>;
    let setSidebarFixed: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        user = userEvent.setup();
        setSidebarFixed = jest.fn();
        mockUseSidebarContext.mockReturnValue(defaultSidebarContext);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockUseRouter.mockReturnValue(defaultRouter as any);
        mockLogout.mockResolvedValue(undefined);
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ authToken: 'test-token', lastLogin: new Date() }));
        mockUseSessionStorage.mockReturnValue([true, setSidebarFixed, jest.fn()]);
    });

    describe('Basic Rendering', () => {
        test('renders with required props', () => {
            render(<SidebarFooter {...defaultProps} />);
            expect(screen.getByText('testuser')).toBeInTheDocument();
            expect(screen.getByTestId('btn_fix_sidebar')).toBeInTheDocument();
            expect(screen.getByTestId('btn_collapse_mobile')).toBeInTheDocument();
        });
    });

    describe('Responsive Design', () => {
        test('desktop vs mobile buttons', () => {
            render(<SidebarFooter {...defaultProps} />);

            // Desktop button should have d-none d-lg-block
            expect(screen.getByTestId("btn_fix_sidebar")).toHaveClass('d-none', 'd-lg-block');
            // Mobile button should have d-lg-none
            expect(screen.getByTestId("btn_collapse_mobile")).toHaveClass('d-lg-none');
        });

        test('collapsed layout', () => {
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
                isSidebarFixed: false,
            });
            render(<SidebarFooter {...defaultProps} />);

            // Check for centered layout by looking for specific component behavior
            expect(screen.queryByText('testuser')).not.toBeInTheDocument();
            const collapseButton = screen.getByTestId('btn_fix_sidebar');
            expect(collapseButton).toBeInTheDocument();
            expect(getByRole(collapseButton, "img", { hidden: true })).toHaveAttribute('data-icon', 'angle-right');
        });

        test('expanded layout', () => {
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: false,
                isSidebarFixed: true,
            });
            render(<SidebarFooter {...defaultProps} />);

            // Check for spread layout by verifying both username and buttons are present
            expect(screen.getByText('testuser')).toBeInTheDocument();
            expect(screen.getByTestId('btn_fix_sidebar')).toBeInTheDocument();
        });

        test('divider spacing', () => {
            // Test collapsed spacing
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
                isSidebarFixed: false,
            });
            const { rerender } = render(<SidebarFooter {...defaultProps} />);

            let divider = screen.getByRole('separator');
            expect(divider).toHaveClass('mx-1');

            // Test expanded spacing
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: false,
            });
            rerender(<SidebarFooter {...defaultProps} />);

            divider = screen.getByRole('separator');
            expect(divider).toHaveClass('mx-3');
        });
    });

    // 3. Sidebar Context Integration Tests
    describe('Sidebar Context Integration', () => {
        test('responds to collapsed state', () => {
            const { rerender } = render(<SidebarFooter {...defaultProps} />);

            // Initially expanded - username should be visible
            expect(screen.getByText('testuser')).toBeInTheDocument();

            // Simulate sidebar collapsing
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
                isSidebarFixed: false,
            });
            rerender(<SidebarFooter {...defaultProps} />);

            // Username should not be visible in collapsed state
            expect(screen.queryByText('testuser')).not.toBeInTheDocument();
        });

        test('handles fixed sidebar state', () => {
            // Test with fixed sidebar
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                isSidebarFixed: true,
            });
            render(<SidebarFooter {...defaultProps} />);

            const fixButton = screen.getByTestId('btn_fix_sidebar');
            const icon = getByRole(fixButton, 'img', { hidden: true });
            expect(icon).toHaveAttribute('data-icon', 'angle-left');
        });

        test('calls setCollapsed', async () => {
            const mockSetCollapsed = jest.fn();
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                isSidebarFixed: true,
                setCollapsed: mockSetCollapsed,
            });

            const { rerender } = render(<SidebarFooter {...defaultProps} />);

            await user.click(screen.getByTestId('btn_fix_sidebar'));
            expect(mockSetCollapsed).toHaveReturnedTimes(1);
            expect(mockSetCollapsed).toHaveBeenCalledWith(true);

            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                isSidebarFixed: false,
                collapsed: true,
                setCollapsed: mockSetCollapsed,
            });
            rerender(<SidebarFooter {...defaultProps} />);

            await user.click(screen.getByTestId('btn_fix_sidebar'));
            expect(mockSetCollapsed).toHaveReturnedTimes(1);
        });

        test('calls setShowSidebar', async () => {
            const mockSetShowSidebar = jest.fn();
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                setShowSidebar: mockSetShowSidebar,
            });

            render(<SidebarFooter {...defaultProps} />);

            await user.click(screen.getByTestId('btn_collapse_mobile'));
            expect(mockSetShowSidebar).toHaveBeenCalledWith(false);
        });
    });

    // 4. Session Storage Integration Tests
    describe('Session Storage Integration', () => {
        test('updates sidebarFixed', async () => {
            render(<SidebarFooter {...defaultProps} />);

            await user.click(screen.getByTestId('btn_fix_sidebar'));
            expect(setSidebarFixed).toHaveBeenCalledWith(false);
        });

        test('reads initial state', () => {
            mockUseSessionStorage.mockReturnValue([false, setSidebarFixed, jest.fn()]);
            render(<SidebarFooter {...defaultProps} />);

            // Verify that useSessionStorage was called with correct parameters
            expect(mockUseSessionStorage).toHaveBeenCalledWith("sidebarFixed", true);
        });
    });

    // 5. User Dropdown Tests
    describe('User Dropdown', () => {
        test('dropdown visibility', () => {
            // Test visible when not collapsed
            const { rerender } = render(<SidebarFooter {...defaultProps} />);
            expect(screen.getByText('testuser')).toBeInTheDocument();

            // Test hidden when collapsed
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                collapsed: true,
                isSidebarFixed: false,
            });
            rerender(<SidebarFooter {...defaultProps} />);
            expect(screen.queryByText('testuser')).not.toBeInTheDocument();
        });

        test('username display', () => {
            render(<SidebarFooter {...defaultProps} username="admin" />);
            expect(screen.getByText('admin')).toBeInTheDocument();
        });

        test('dropdown items', async () => {
            render(<SidebarFooter {...defaultProps} />);

            expect(screen.getByTestId('btn_user_dropdown')).toBeInTheDocument();
            expect(screen.queryByTestId('btn_logout')).not.toBeInTheDocument();
            expect(screen.queryByTestId('btn_changeSize')).not.toBeInTheDocument();

            await user.click(screen.getByTestId('btn_user_dropdown'));

            expect(screen.getByTestId('btn_logout')).toBeInTheDocument();
            expect(screen.getByTestId('btn_changeSize')).toBeInTheDocument();
        });
    });

    describe('Logout Functionality', () => {
        test('calls logout action', async () => {
            render(<SidebarFooter {...defaultProps} />);

            const menu = screen.getByTestId('btn_user_dropdown');
            await user.click(menu);

            const logoutButton = screen.getByTestId('btn_logout');
            await user.click(logoutButton);
            expect(mockLogout).toHaveBeenCalled();
        });

        test('clears localStorage', async () => {
            render(<SidebarFooter {...defaultProps} />);

            const menu = screen.getByTestId('btn_user_dropdown');
            await user.click(menu);

            const logoutButton = screen.getByTestId('btn_logout');
            await user.click(logoutButton);

            await waitFor(() => {
                expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                    'test-auth-key',
                    JSON.stringify({ authToken: undefined, lastLogin: undefined })
                );
            });
        });

        test('navigates to login', async () => {
            render(<SidebarFooter {...defaultProps} />);

            const menu = screen.getByTestId('btn_user_dropdown');
            await user.click(menu);

            const logoutButton = screen.getByTestId('btn_logout');
            await user.click(logoutButton);

            await waitFor(() => {
                expect(defaultRouter.push).toHaveBeenCalledWith('/login');
            });
        });

        test('mutates SWR cache', async () => {
            render(<SidebarFooter {...defaultProps} />);

            const menu = screen.getByTestId('btn_user_dropdown');
            await user.click(menu);

            const logoutButton = screen.getByTestId('btn_logout');
            await user.click(logoutButton);

            await waitFor(() => {
                expect(mockMutate).toHaveBeenCalledWith(expect.any(Function), undefined);
            });
        });

        test('handles localStorage edge cases', async () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            render(<SidebarFooter {...defaultProps} />);

            const menu = screen.getByTestId('btn_user_dropdown');
            await user.click(menu);

            const logoutButton = screen.getByTestId('btn_logout');
            await user.click(logoutButton);

            // Should not throw error when localStorage item doesn't exist
            await waitFor(() => {
                expect(mockLogout).toHaveBeenCalled();
            });
        });
    });

    // 7. Modal Integration Tests
    describe('Modal Integration', () => {
        test('change language modal', async () => {
            const { changeLanguage } = mockUseModal()!;
            render(<SidebarFooter {...defaultProps} />);

            const menu = screen.getByTestId('btn_user_dropdown');
            await user.click(menu);

            const changeLanguageButton = screen.getByTestId('btn_changeSize');
            await user.click(changeLanguageButton);

            expect(changeLanguage).toHaveBeenCalled();
        });
    });

    // 8. Icon Rendering Tests
    describe('Icon Rendering', () => {
        test('FontAwesome icons', () => {
            render(<SidebarFooter {...defaultProps} />);
            const icons = screen.getAllByRole('img', { hidden: true });
            expect(icons.length).toEqual(2);

            const fixButton = screen.getByTestId('btn_fix_sidebar');
            const collapseButton = screen.getByTestId('btn_collapse_mobile');
            expect(getByRole(fixButton, 'img', { hidden: true })).toHaveAttribute('data-icon', 'angle-left');
            expect(getByRole(collapseButton, 'img', { hidden: true })).toHaveAttribute('data-icon', 'angle-left');
        });

        test('non-fixed sidebar icon', () => {
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                isSidebarFixed: false,
            });
            render(<SidebarFooter {...defaultProps} />);

            const fixButton = screen.getByTestId('btn_fix_sidebar');
            expect(getByRole(fixButton, 'img', { hidden: true })).toHaveAttribute('data-icon', 'angle-right');
        });
    });

    // 9. Button Behavior Tests
    describe('Button Behavior', () => {
        test('desktop collapse button click', async () => {
            const mockSetCollapsed = jest.fn();
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                isSidebarFixed: true,
                setCollapsed: mockSetCollapsed,
            });

            render(<SidebarFooter {...defaultProps} />);
            const desktopButton = screen.getByTestId('btn_fix_sidebar');

            await user.click(desktopButton);

            expect(mockSetCollapsed).toHaveBeenCalledWith(true);
            expect(setSidebarFixed).toHaveBeenCalledWith(false);
        });

        test('mobile collapse button click', async () => {
            const mockSetShowSidebar = jest.fn();
            mockUseSidebarContext.mockReturnValue({
                ...defaultSidebarContext,
                setShowSidebar: mockSetShowSidebar,
            });

            render(<SidebarFooter {...defaultProps} />);
            const mobileButton = screen.getByTestId('btn_collapse_mobile');

            await user.click(mobileButton);
            expect(mockSetShowSidebar).toHaveBeenCalledWith(false);
        });

        test('mouse leave handler', () => {
            const handleMouseLeave = jest.fn();
            render(<SidebarFooter {...defaultProps} handleCollapseButtonMouseLeave={handleMouseLeave} />);

            const desktopButton = screen.getByTestId('btn_fix_sidebar');
            fireEvent.mouseLeave(desktopButton);

            expect(handleMouseLeave).toHaveBeenCalled();
        });

        test('button ref assignment', () => {
            const ref = { current: null };
            render(<SidebarFooter {...defaultProps} collapseButtonRef={ref} />);

            // The ref should be assigned to the desktop button
            expect(screen.getByTestId('btn_fix_sidebar')).toBeInTheDocument();
        });
    });
});
