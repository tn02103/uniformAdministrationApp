import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UniformListTableLine, UniformListTableLineProps } from "./UniformListTableLine";
import { mockTypeList, mockUniformList } from "../../../../../../../../tests/_jestConfig/staticMockData";
import { AuthRole } from "@/lib/AuthRoles";
import dayjs from "@/lib/dayjs";

// Mock useGlobalData
jest.mock("@/components/globalDataProvider", () => ({
    useGlobalData: () => ({ userRole: AuthRole.admin }),
}));

// Mock UniformOffcanvas
jest.mock("@/components/UniformOffcanvas/UniformOffcanvas", () => ({
    UniformOffcanvas: ({ onClose }: { onClose: () => void }) => (
        <div data-testid="offcanvas">
            Offcanvas
            <button data-testid="btn-close" onClick={onClose}>Close</button>
        </div>
    ),
}));

// Mock TooltipActionButton
jest.mock("@/components/Buttons/TooltipIconButton", () => ({
    TooltipActionButton: (props: { onClick: () => void }) => (
        <button data-testid="tooltip-action-btn" onClick={props.onClick}>Open</button>
    ),
}));

const setup = (props?: Partial<UniformListTableLineProps>) => {
    render(
        <table>
            <tbody>
                <UniformListTableLine
                    uniform={mockUniformList[0]}
                    uniformType={mockTypeList[0]}
                    searchString=""
                    loadData={jest.fn()}
                    {...props}
                />
            </tbody>
        </table>
    )
}
describe("UniformListTableLine", () => {
    const uniformWithOwner = {
        ...mockUniformList[0],
        issuedEntries: [
            {
                cadet: { id: "cadet1", lastname: "Doe", firstname: "John", recdelete: null, recdeleteUser: null },
                dateIssued: dayjs("2023-01-01").toDate(),
            }
        ],

    };
    const uniformWithStorage = {
        ...mockUniformList[0],
        storageUnit: { name: "Storage 1", id: "storage1", description: "Some Storage Unit", isReserve: false },
    }


    it("renders all columns and highlights number", () => {
        setup({ searchString: "2501" });

        expect(screen.getByTestId(`div_uitem_${mockUniformList[0].id}`)).toBeInTheDocument();
        expect(screen.getByTestId("div_number")).toHaveTextContent("2501");
        expect(screen.getByTestId("div_generation")).toHaveTextContent(mockUniformList[0].generation.name);
        expect(screen.getByTestId("div_size")).toHaveTextContent(mockUniformList[0].size.name);
        expect(screen.getByTestId("div_comment")).toHaveTextContent("Test comment");
        expect(screen.getByTestId("tooltip-action-btn")).toBeInTheDocument();
    });

    it("shows owner link with tooltip if issuedEntries exist", () => {
        setup({ uniform: uniformWithOwner })

        const ownerLink = screen.getByTestId("lnk_owner");
        expect(ownerLink).toBeInTheDocument();
        expect(ownerLink).toHaveAttribute("href", "/app/cadet/cadet1");
        expect(ownerLink).toHaveTextContent("Doe John");
    });

    it("shows storage unit name and icon if present", async () => {
        setup({ uniform: uniformWithStorage });

        expect(screen.getByText("Storage 1")).toBeInTheDocument();
        const icon = screen.getByRole("img", { hidden: true });
        expect(icon).toHaveClass("fa-box-open");
        await userEvent.hover(icon);
        await waitFor(() => {
            expect(screen.getByText(/Some Storage Unit/)).toBeInTheDocument();
        });
    });

    it("shows icon if uniform is not active", () => {
        setup({ uniform: { ...mockUniformList[0], active: false } });

        expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument();
        expect(screen.getByRole("img", { hidden: true })).toHaveClass("fa-registered");
    });

    it("does not render generation or size columns if not used by type", () => {
        setup({ uniformType: { ...mockTypeList[0], usingGenerations: false, usingSizes: false } });

        expect(screen.queryByTestId("div_generation")).not.toBeInTheDocument();
        expect(screen.queryByTestId("div_size")).not.toBeInTheDocument();
    });

    it("shows 'K.A.' if generation or size is missing", () => {
        setup({ uniform: { ...mockUniformList[0], generation: null, size: null } });

        expect(screen.getByTestId("div_generation")).toHaveTextContent("K.A.");
        expect(screen.getByTestId("div_size")).toHaveTextContent("K.A.");
    });

    it("opens and closes UniformOffcanvas on action button click", async () => {
        setup();

        const user = userEvent.setup();
        await user.click(screen.getByTestId("tooltip-action-btn"));
        expect(screen.getByTestId("offcanvas")).toBeInTheDocument();
        await user.click(screen.getByTestId("btn-close"));
        expect(screen.queryByTestId("offcanvas")).not.toBeInTheDocument();
    });
});
