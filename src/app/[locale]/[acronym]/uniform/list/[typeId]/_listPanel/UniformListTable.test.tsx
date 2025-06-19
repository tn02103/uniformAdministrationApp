import { UniformWithOwner } from "@/types/globalUniformTypes";
import { render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockTypeList, mockUniformList } from "../../../../../../../../tests/_jestConfig/staticMockData";
import { UniformListTable } from "./UniformListTable";

// Mock next/navigation
const pushMock = jest.fn();
const paramsGet = jest.fn().mockReturnValue(null);
const paramsHas = jest.fn().mockReturnValue(false);
jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock }),
    useSearchParams: () => ({
        get: paramsGet,
        has: paramsHas,
    }),
    usePathname: () => "/app/uniform/list/81ff8e9b-a097-4879-a0b2-352e54d41e6c",
}));

// Mock useSessionStorage
jest.mock("usehooks-ts", () => ({
    useSessionStorage: () => [null, jest.fn()],
}));

// Mock getUniformListWithOwner
jest.mock("@/dal/uniform/item/_index", () => ({
    getUniformListWithOwner: jest.fn().mockResolvedValue(mockUniformList),
}));

// Mock UniformListTableLine
jest.mock("./UniformListTableLine", () => ({
    UniformListTableLine: ({ uniform }: { uniform: UniformWithOwner }) => (
        <tr data-testid={`div_uitem_${uniform.id}`}>
            <td>{uniform.number}</td>
        </tr>
    ),
}));

describe("UniformListTable", () => {
    const uniformType = mockTypeList[0];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders table headers and no data row if no uniforms", async () => {
        const { getUniformListWithOwner } = jest.requireMock("@/dal/uniform/item/_index");
        getUniformListWithOwner.mockResolvedValueOnce([]);

        render(<UniformListTable uniformType={uniformType} />);
        expect(await screen.findByText("common.uniform.number")).toBeInTheDocument();
        expect(await screen.findByTestId("div_nodata")).toBeInTheDocument();
    });

    it("renders correct number of table lines for uniforms", async () => {
        render(<UniformListTable uniformType={uniformType} />);
        await waitForElementToBeRemoved(() => screen.queryByText("uniformList.noData"));

        for (const uniform of mockUniformList) {
            expect(screen.getByTestId(`div_uitem_${uniform.id}`)).toBeInTheDocument();
        }
    });

    it("shows correct count in header", async () => {
        const t = jest.requireMock("@/lib/locales/client").useI18n();

        render(<UniformListTable uniformType={uniformType} />);
        await waitForElementToBeRemoved(() => screen.queryByText("uniformList.noData"));

        const headerCount = await screen.findByTestId("div_header_count");
        expect(headerCount).toHaveTextContent("uniformList.numberOfEntries");
        expect(t).toHaveBeenCalledWith("uniformList.numberOfEntries", { count: mockUniformList.length });
    });

    it("filters uniforms by search param", async () => {
        paramsGet.mockImplementation((key: string) => {
            if (key === "search") return mockUniformList[0].number; // Simulate search for first uniform number
            return null;
        });
        paramsHas.mockImplementation((key: string) => key === "search");

        render(<UniformListTable uniformType={uniformType} />);
        await waitForElementToBeRemoved(() => screen.queryByText("uniformList.noData"));

        // Only the uniform with number 2501 should be rendered
        expect(await screen.findByTestId(`div_uitem_${mockUniformList[0].id}`)).toBeInTheDocument();
        expect(screen.queryByTestId(`div_uitem_${mockUniformList[1].id}`)).not.toBeInTheDocument();

        paramsGet.mockReset();
        paramsHas.mockReset();
    });

    it("calls changeSortOrder and updates router on header click", async () => {
        render(<UniformListTable uniformType={uniformType} />);
        const btn = await screen.findByTestId("btn_header_owner");
        const user = userEvent.setup();
        await user.click(btn);
        expect(pushMock).toHaveBeenCalled();
    });

    it("renders no data row if uniformType is null", () => {
        render(<UniformListTable uniformType={null} />);
        expect(screen.getByTestId("div_nodata")).toBeInTheDocument();
    });
});