import { UniformGeneration, UniformType } from "@/types/globalUniformTypes";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testTypes } from "./testTypes";
import { UniformGenerationTable } from "./UniformGenerationTable";
import { UniformgenerationOffcanvas } from "./UniformGenerationOffcanvas";
import { changeUniformGenerationSortOrder } from "@/dal/uniform/generation/_index";
import { useUniformTypeList } from "@/dataFetcher/uniformAdmin";
import { toast } from "react-toastify";
import { vi, type Mock } from 'vitest';

const testType = testTypes[0];

// ################## MOCKS ##################
vi.mock("@/dataFetcher/uniformAdmin", () => {
    const typeListMutate = vi.fn(async (a) => { return a; });
    return {
        useUniformTypeList: vi.fn(() => ({
            mutate: typeListMutate,
        })),
    };
});
vi.mock("@/dal/uniform/generation/_index", () => {
    return {
        changeUniformGenerationSortOrder: vi.fn(() => "uniform generation sortOrder changed"),
    };
});
vi.mock("./UniformGenerationOffcanvas", () => {
    const mock = vi.fn(({ onHide }) => <div data-testid="generationOffcanvasMock" onClick={onHide}>Generation Offcanvas</div>);
    return {
        UniformgenerationOffcanvas: mock,
    };
});
 
let onDragEndFunction: undefined | ((newArray: UniformGeneration[], itemId: string) => Promise<any>) = undefined;
vi.mock("@/components/reorderDnD/ReorderableTableBody", () => {
    return {
        ReorderableTableBody: vi.fn(({ items, onDragEnd, children }) => {
            onDragEndFunction = onDragEnd;
            return (
                <tbody data-testid="reorderable-table-body">
                    {  }
                    {items.map(((item: any) => children({ item, draggableRef: undefined, previewRef: undefined, isDragging: false })))}
                </tbody>
            )
        }),
    };
});

// ################## TESTS ##################
describe('<UniformGenerationTable />', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders the component', () => {
        render(<UniformGenerationTable uniformType={testType} />);

        expect(screen.getByTestId("uniform-generation-table")).toBeInTheDocument();
        expect(screen.getByTestId("uniform-generation-table")).toMatchSnapshot();
    });

    it('marks generation as invalid if fk_sizelist is null and type usingSizes', () => {
        const testTypeWithInvalidGeneration: UniformType = {
            ...testType,
            uniformGenerationList: [
                ...testType.uniformGenerationList,
                {
                    id: "invalid-generation",
                    name: "Invalid Generation",
                    isReserve: false,
                    sortOrder: 4,
                    fk_sizelist: null,
                    sizelist: null,
                },
            ],
        };
        render(<UniformGenerationTable uniformType={testTypeWithInvalidGeneration} />);

        // validate invalid generation row
        const invalidGenerationRow = screen.getByRole("row", { name: "Invalid Generation" });
        expect(invalidGenerationRow?.childNodes[0]).toHaveClass("text-danger");
        expect(invalidGenerationRow?.childNodes[1]).toHaveClass("text-danger");
        expect(invalidGenerationRow?.childNodes[2]).toHaveClass("text-danger");
        expect(within(invalidGenerationRow).getByRole("button")).toHaveClass("text-danger");

        // validate valid generation row
        const validGenerationRow = screen.getByRole("row", testType.uniformGenerationList[0]);
        expect(validGenerationRow?.childNodes[0]).not.toHaveClass("text-danger");
        expect(validGenerationRow?.childNodes[1]).not.toHaveClass("text-danger");
        expect(validGenerationRow?.childNodes[2]).not.toHaveClass("text-danger");
        expect(within(validGenerationRow).getByRole("button")).not.toHaveClass("text-danger");
    });

    it('opens the generation offcanvas when clicking the open button', async () => {
        const user = userEvent.setup();
        render(<UniformGenerationTable uniformType={testType} />);

        // open generation offcanvas
        const openButton = within(screen.getByRole("row", { name: "Test Generation 1" })).getByRole("button");
        expect(openButton).toBeDefined();
        expect(openButton).not.toBeNull();
        await user.click(openButton!);

        // validate generactionOffacanvas mock call
        expect(screen.getByTestId("generationOffcanvasMock")).toBeInTheDocument();
        expect(UniformgenerationOffcanvas).toHaveBeenCalledTimes(1);
        expect(UniformgenerationOffcanvas).toHaveBeenCalledWith({
            uniformTypeId: testType.id,
            usingSizes: testType.usingSizes,
            onHide: expect.any(Function),
            generation: testType.uniformGenerationList[0],
        }, undefined);

        // close generation offcanvas
        expect(screen.getByTestId("generationOffcanvasMock")).toHaveTextContent("Generation Offcanvas");
        await user.click(screen.getByTestId("generationOffcanvasMock"));
        expect(screen.queryByTestId("generationOffcanvasMock")).not.toBeInTheDocument();
    });

    it('opens the generation offcanvas when clicking the create button', async () => {
        const user = userEvent.setup();
        render(<UniformGenerationTable uniformType={testType} />);

        // open generation offcanvas
        const createButton = screen.getByTestId("btn_create");
        expect(createButton).toBeDefined();
        expect(createButton).not.toBeNull();
        await user.click(createButton!);

        // validate generactionOffacanvas mock call
        expect(screen.getByTestId("generationOffcanvasMock")).toBeInTheDocument();
        expect(UniformgenerationOffcanvas).toHaveBeenCalledTimes(1);
        expect(UniformgenerationOffcanvas).toHaveBeenCalledWith({
            uniformTypeId: testType.id,
            usingSizes: testType.usingSizes,
            onHide: expect.any(Function),
            generation: null,
        }, undefined);

        // close generation offcanvas
        expect(screen.getByTestId("generationOffcanvasMock")).toHaveTextContent("Generation Offcanvas");
        await user.click(screen.getByTestId("generationOffcanvasMock"));
        expect(screen.queryByTestId("generationOffcanvasMock")).not.toBeInTheDocument();
    });

    it('changes sortOrder when onDragEnd is triggered', async () => {
        render(<UniformGenerationTable uniformType={testType} />);

        // trigger onDragEnd
        expect(onDragEndFunction).toBeDefined();
        await onDragEndFunction!([
            testType.uniformGenerationList[1],
            testType.uniformGenerationList[0],
            testType.uniformGenerationList[2],
        ], testType.uniformGenerationList[0].id);

        // validate changeUniformGenerationSortOrder call
        expect(changeUniformGenerationSortOrder).toHaveBeenCalledTimes(1);
        expect(changeUniformGenerationSortOrder).toHaveBeenCalledWith({
            id: testType.uniformGenerationList[0].id,
            newPosition: 1
        });
        expect(useUniformTypeList().mutate).toHaveBeenCalledTimes(1);
        expect(useUniformTypeList().mutate).toHaveBeenCalledWith("uniform generation sortOrder changed");

        // validate toast call
        expect(toast.success).toHaveBeenCalledTimes(1);
        expect(toast.success).toHaveBeenCalledWith("common.success.changeSortorder");
    });

    it('catches error when sortOrder function fails', async () => {
        (changeUniformGenerationSortOrder as Mock).mockImplementationOnce(async () => { throw new Error("Error") });
        render(<UniformGenerationTable uniformType={testType} />);

        // trigger onDragEnd
        expect(onDragEndFunction).toBeDefined();
        await onDragEndFunction!([
            testType.uniformGenerationList[1],
            testType.uniformGenerationList[0],
            testType.uniformGenerationList[2],
        ], testType.uniformGenerationList[0].id);

        // validate changeUniformGenerationSortOrder call
        expect(changeUniformGenerationSortOrder).toHaveBeenCalledTimes(1);
        expect(changeUniformGenerationSortOrder).toHaveBeenCalledWith({
            id: testType.uniformGenerationList[0].id,
            newPosition: 1
        });
        expect(useUniformTypeList().mutate).toHaveBeenCalledTimes(1);
        expect(useUniformTypeList().mutate).not.toHaveBeenCalledWith("uniform generation sortOrder changed");

        // validate toast call
        expect(toast.success).toHaveBeenCalledTimes(0);
        expect(toast.error).toHaveBeenCalledTimes(1);
        expect(toast.error).toHaveBeenCalledWith("common.error.actions.changeSortorder");
    });

    it('does not call sortOrder function when itemId is not in the list', () => {
        render(<UniformGenerationTable uniformType={testType} />);

        expect(onDragEndFunction).toBeDefined();
        onDragEndFunction!([
            testType.uniformGenerationList[1],
            testType.uniformGenerationList[0],
            testType.uniformGenerationList[2],
        ], "invalid-item-id");

        expect(changeUniformGenerationSortOrder).not.toHaveBeenCalled();
    });

    it('does not call sortOrder function when list has wrong size', () => {
        render(<UniformGenerationTable uniformType={testType} />);

        expect(onDragEndFunction).toBeDefined();
        onDragEndFunction!([
            testType.uniformGenerationList[1],
            testType.uniformGenerationList[0],
        ], testType.uniformGenerationList[0].id);

        expect(changeUniformGenerationSortOrder).not.toHaveBeenCalled();
    });

    it('does not show sizeList column when usingSizes is false', () => {
        const testTypeWithoutSizeList: UniformType = {
            ...testType,
            usingSizes: false,
        };
        render(<UniformGenerationTable uniformType={testTypeWithoutSizeList} />);

        expect(screen.queryByText("common.uniform.sizelist.label")).not.toBeInTheDocument();

        const row = screen.getByRole("row", { name: "Test Generation 1" });
        expect(row).not.toBeNull();
        expect(row!.childNodes).toHaveLength(4);
    });
    it('shows reserve column on Mobile when !usingSizes', () => {
        const testTypeWithoutSizeList: UniformType = {
            ...testType,
            usingSizes: false,
        };
        render(<UniformGenerationTable uniformType={testTypeWithoutSizeList} />);

        expect(screen.getByText("common.uniform.generation.isReserve")).toBeInTheDocument();
        expect(screen.queryByText("common.uniform.generation.isReserve")).not.toHaveClass("d-none d-sm-table-cell");

        const row = screen.getByRole("row", { name: "Test Generation 1" });
        expect(row).not.toBeNull();
        expect(row?.childNodes[2]).not.toHaveClass("d-none d-sm-table-cell");
    });
    it('hides reserve column on Mobile when usingSizes', () => {
        render(<UniformGenerationTable uniformType={testType} />);

        expect(screen.getByText("common.uniform.generation.isReserve")).toBeInTheDocument();
        expect(screen.queryByText("common.uniform.generation.isReserve")).toHaveClass("d-none d-sm-table-cell");

        const row = screen.getByRole("row", { name: "Test Generation 1" });
        expect(row).not.toBeNull();
        expect(row?.childNodes[2]).toHaveClass("d-none d-sm-table-cell");
    });
});