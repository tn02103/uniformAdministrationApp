import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UniformListTableLine } from "./UniformListTableLine";
import { mockTypeList, mockUniformList } from "../../../../../../../../tests/_jestConfig/staticMockData";
import { AuthRole } from "@/lib/AuthRoles";

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

describe("UniformListTableLine", () => {
    const uniformType = { ...mockTypeList[0], usingGenerations: true, usingSizes: true };
    const uniform = {
        ...mockUniformList[0],
        issuedEntries: [
            {
                cadet: { id: "cadet1", lastname: "Doe", firstname: "John", recdelete: null, recdeleteUser: null },
                dateIssued: "2023-01-01",
            }
        ],
        storageUnit: { name: "Storage 1", id: "storage1", description: "", isReserve: false },
    };

    it("renders all columns and highlights number", () => {
        render(
            <table>
                <tbody>
                    <UniformListTableLine
                        uniform={uniform}
                        uniformType={uniformType}
                        searchString="2501"
                        loadData={jest.fn()}
                    />
                </tbody>
            </table>
        );
        expect(screen.getByTestId(`div_uitem_${uniform.id}`)).toBeInTheDocument();
        expect(screen.getByTestId("div_number")).toHaveTextContent("2501");
        expect(screen.getByTestId("div_generation")).toHaveTextContent(uniform.generation.name);
        expect(screen.getByTestId("div_size")).toHaveTextContent(uniform.size.name);
        expect(screen.getByTestId("div_comment")).toHaveTextContent("Test comment");
        expect(screen.getByTestId("tooltip-action-btn")).toBeInTheDocument();
    });

    it("shows owner link with tooltip if issuedEntries exist", () => {
        render(
            <table>
                <tbody>
                    <UniformListTableLine
                        uniform={uniform}
                        uniformType={uniformType}
                        searchString=""
                        loadData={jest.fn()}
                    />
                </tbody>
            </table>
        );
        const ownerLink = screen.getByTestId("lnk_owner");
        expect(ownerLink).toBeInTheDocument();
        expect(ownerLink).toHaveAttribute("href", "/app/cadet/cadet1");
        expect(ownerLink).toHaveTextContent("Doe John");
    });

    it("shows storage unit name if present", () => {
        render(
            <table>
                <tbody>
                    <UniformListTableLine
                        uniform={uniform}
                        uniformType={uniformType}
                        searchString=""
                        loadData={jest.fn()}
                    />
                </tbody>
            </table>
        );
        expect(screen.getByText("Storage 1")).toBeInTheDocument();
    });

    it("shows badge if uniform is not active", () => {
        render(
            <table>
                <tbody>
                    <UniformListTableLine
                        uniform={{ ...uniform, active: false }}
                        uniformType={uniformType}
                        searchString=""
                        loadData={jest.fn()}
                    />
                </tbody>
            </table>
        );
        expect(screen.getByText("common.uniform.state.reserve")).toBeInTheDocument();
    });

    it("does not render generation or size columns if not used by type", () => {
        render(
            <table>
                <tbody>
                    <UniformListTableLine
                        uniform={uniform}
                        uniformType={{ ...uniformType, usingGenerations: false, usingSizes: false }}
                        searchString=""
                        loadData={jest.fn()}
                    />
                </tbody>
            </table>
        );
        expect(screen.queryByTestId("div_generation")).not.toBeInTheDocument();
        expect(screen.queryByTestId("div_size")).not.toBeInTheDocument();
    });

    it("shows 'K.A.' if generation or size is missing", () => {
        render(
            <table>
                <tbody>
                    <UniformListTableLine
                        uniform={{ ...uniform, generation: null, size: null }}
                        uniformType={uniformType}
                        searchString=""
                        loadData={jest.fn()}
                    />
                </tbody>
            </table>
        );
        expect(screen.getByTestId("div_generation")).toHaveTextContent("K.A.");
        expect(screen.getByTestId("div_size")).toHaveTextContent("K.A.");
    });

    it("opens and closes UniformOffcanvas on action button click", async () => {
        render(
            <table>
                <tbody>
                    <UniformListTableLine
                        uniform={uniform}
                        uniformType={uniformType}
                        searchString=""
                        loadData={jest.fn()}
                    />
                </tbody>
            </table>
        );
        const user = userEvent.setup();
        await user.click(screen.getByTestId("tooltip-action-btn"));
        expect(screen.getByTestId("offcanvas")).toBeInTheDocument();
        await user.click(screen.getByTestId("btn-close"));
        expect(screen.queryByTestId("offcanvas")).not.toBeInTheDocument();
    });
});
