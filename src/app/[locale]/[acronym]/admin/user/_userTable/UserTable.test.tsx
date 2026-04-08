import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, type Mock } from "vitest";
import { UserTable } from "./UserTable";
import { User } from "@/types/userTypes";
import { Props } from "../_userOffcanvas/UserOffcanvas";

const mockUsers: User[] = [
    {
        id: "1",
        name: "John Doe",
        username: "johndoe",
        email: "john@example.com",
        role: 1,
        active: true,
    },
    {
        id: "2",
        name: "Jane Smith",
        username: "janesmith",
        email: "jane@example.com",
        role: 4,
        active: true,
    },
    {
        id: "3",
        name: "Bob Johnson",
        username: "bjohnson",
        email: "bob@example.com",
        role: 2,
        active: false,
    },
];

const mockMutate = vi.fn();

vi.mock("@/dataFetcher/user", () => ({
    useUserList: vi.fn(() => ({
        userList: mockUsers,
        mutate: mockMutate,
    })),
}));

vi.mock("../_userOffcanvas/UserOffcanvas", () => ({
    UserOffcanvas: vi.fn(({ user, setSelectedUserId, editable, setEditable }: Props) => (
        <div data-testid="user-offcanvas">
            <div data-testid="offcanvas-user-name">{user?.name}</div>
            <button onClick={() => setSelectedUserId(null)}>Close</button>
            <div data-testid="editable">{editable ? "Editable" : "Not Editable"}</div>
            <button onClick={() => setEditable(prev => !prev)}>Toggle Editable</button>
        </div>
    )),
}));

describe("<UserTable />", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the user table with correct columns", () => {
        render(<UserTable initialUserList={mockUsers} />);

        expect(screen.getByRole("table")).toBeInTheDocument();

        // Check headers
        expect(screen.getByText(/label.name/)).toBeInTheDocument();
        expect(screen.getByText(/label.username/)).toBeInTheDocument();
        expect(screen.getByText(/label.email/)).toBeInTheDocument();
        expect(screen.getByText(/label.role/)).toBeInTheDocument();
        expect(screen.getByText(/label.activeStatus/)).toBeInTheDocument();
    });

    it("renders all users in the table", () => {
        render(<UserTable initialUserList={mockUsers} />);

        mockUsers.forEach(user => {
            expect(screen.getByText(user.name)).toBeInTheDocument();
            expect(screen.getByText(user.username)).toBeInTheDocument();
            expect(screen.getByText(user.email)).toBeInTheDocument();
        });
    });



    it("shows offcanvas when user row is clicked", async () => {
        const user = userEvent.setup();
        render(<UserTable initialUserList={mockUsers} />);

        const userRow = screen.getByText("John Doe");
        await user.click(userRow);

        expect(screen.getByTestId("user-offcanvas")).toBeInTheDocument();
        expect(screen.getByTestId("offcanvas-user-name")).toHaveTextContent("John Doe");
    });

    it("shows correct role translations", () => {
        render(<UserTable initialUserList={mockUsers} />);

        // The role labels come from i18n mock
        mockUsers.forEach(u => {
            expect(screen.getByText(`common.user.authRole.${u.role}`)).toBeInTheDocument();
        });
    });

    it("shows correct active status translations", () => {
        render(<UserTable initialUserList={mockUsers} />);

        // Active users - there are 2 active users
        expect(screen.getAllByText("common.user.active.true")).toHaveLength(2);
        // Inactive users - there is 1 inactive user
        expect(screen.getByText("common.user.active.false")).toBeInTheDocument();
    });

    describe("create button behavior", () => {
        it("renders create button", () => {
            render(<UserTable initialUserList={mockUsers} />);

            // Find button with variantKey="create"
            const buttons = screen.getAllByRole("button");
            expect(buttons.length).toBeGreaterThan(0);
        });

        // it disables create button when editable is true
        it("disables create and row buttons when editable is true", async () => {
            const user = userEvent.setup();
            render(<UserTable initialUserList={mockUsers} />);

            const createButton = screen.getByRole("button", { name: /create/i });
            const row1 = screen.getByRole("row", { name: /johndoe/i });

            expect(createButton).toBeEnabled();
            expect(row1).toHaveStyle("cursor: pointer");
            expect(row1).toHaveAttribute("aria-disabled", "false");

            await user.click(createButton);
            expect(createButton).toBeDisabled();
            expect(row1).toHaveStyle("cursor: not-allowed");
            expect(row1).toHaveAttribute("aria-disabled", "true");
        });

        it("opens offcanvas in create mode when create button is clicked", async () => {
            const user = userEvent.setup();
            render(<UserTable initialUserList={mockUsers} />);

            const createButton = screen.getByRole("button", { name: /create/i });
            await user.click(createButton);

            expect(screen.getByTestId("user-offcanvas")).toBeInTheDocument();
            expect(screen.getByTestId("offcanvas-user-name")).toHaveTextContent("");
        });
    });

    describe("user row click behavior", () => {

        it("opens offcanvas with user details when user row is clicked", async () => {
            const user = userEvent.setup();
            render(<UserTable initialUserList={mockUsers} />);

            const userRow = screen.getByRole("row", { name: /johndoe/i });
            await user.click(userRow);

            expect(screen.getByTestId("user-offcanvas")).toBeInTheDocument();
            expect(screen.getByTestId("offcanvas-user-name")).toHaveTextContent("John Doe");
        });
        
        it("does not set editable true when user row is clicked", async () => {
            const user = userEvent.setup();
            render(<UserTable initialUserList={mockUsers} />);

            const userRow = screen.getByRole("row", { name: /johndoe/i });
            await user.click(userRow);

            expect(screen.getByTestId("editable")).toHaveTextContent("Not Editable");
        });

        it("toggles editable state when toggle button in offcanvas is clicked", async () => {
            const user = userEvent.setup();
            render(<UserTable initialUserList={mockUsers} />);

            const userRow = screen.getByRole("row", { name: /johndoe/i });
            await user.click(userRow);

            const toggleButton = screen.getByRole("button", { name: /toggle editable/i });
            await user.click(toggleButton);

            expect(screen.getByTestId("editable")).toHaveTextContent("Editable");

            await user.click(toggleButton);
            expect(screen.getByTestId("editable")).toHaveTextContent("Not Editable");
        });

        it("disables user row clicks when editable is true", async () => {
            const user = userEvent.setup();
            render(<UserTable initialUserList={mockUsers} />);

            // Click create button to set editable true
            const row1 = screen.getByRole("row", { name: /johndoe/i });
            const row2 = screen.getByRole("row", { name: /janesmith/i });
            const createButton = screen.getByRole("button", { name: /create/i });
            
            expect(row1).toHaveStyle("cursor: pointer");
            expect(row2).toHaveStyle("cursor: pointer");
            expect(createButton).toBeEnabled();


            await user.click(row1);
            expect(screen.getByTestId("offcanvas-user-name")).toHaveTextContent("John Doe");
            expect(screen.getByTestId("editable")).toHaveTextContent("Not Editable");
  
            expect(row1).toHaveStyle("cursor: pointer");
            expect(row2).toHaveStyle("cursor: pointer");
            expect(createButton).toBeEnabled();

            const editableToggleButton = screen.getByRole("button", { name: /toggle editable/i });
            await user.click(editableToggleButton);
            expect(screen.getByTestId("editable")).toHaveTextContent("Editable");

            expect(row1).toHaveStyle("cursor: not-allowed");
            expect(row2).toHaveStyle("cursor: not-allowed");
            expect(createButton).toBeDisabled();

            // Try clicking on a user row
            await user.click(row2);

            // Offcanvas should still show create mode (empty name) because row clicks are disabled
            expect(screen.getByTestId("offcanvas-user-name")).toHaveTextContent("John Doe");
        });
    });
});
