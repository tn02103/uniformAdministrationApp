import { UniformGeneration, UniformType } from "@/types/globalUniformTypes";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testTypes } from "./testTypes";
import { UniformGenerationTable } from "./UniformGenerationTable";

const testType = testTypes[0];

// ################## MOCKS ##################
jest.mock("@/dataFetcher/uniformAdmin", () => {
    const typeListMutate = jest.fn(async (a) => { return a; });
    return {
        useUniformTypeList: jest.fn(() => ({
            mutate: typeListMutate,
        })),
    };
});
jest.mock("@/dal/uniform/generation/_index", () => {
    return {
        changeUniformGenerationSortOrder: jest.fn(() => "uniform generation sortOrder changed"),
    };
});
jest.mock("./UniformGenerationOffcanvas", () => {
    const mock = jest.fn(({ onHide }) => <div data-testid="generationOffcanvasMock" onClick={onHide}>Generation Offcanvas</div>);
    return {
        UniformgenerationOffcanvas: mock,
    };
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let onDragEndFunction: undefined | ((newArray: UniformGeneration[], itemId: string) => Promise<any>) = undefined;
jest.mock("@/components/reorderDnD/ReorderableTableBody", () => {
    return {
        ReorderableTableBody: jest.fn(({ items, onDragEnd, children }) => {
            onDragEndFunction = onDragEnd;
            return (
                <tbody data-testid="reorderable-table-body">
                    { /* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {items.map(((item: any) => children({ item, draggableRef: undefined, previewRef: undefined, isDragging: false })))}
                </tbody>
            )
        }),
    };
});

// ################## TESTS ##################
describe('<UniformGenerationTable />', () => {
    const { UniformgenerationOffcanvas } = jest.requireMock("./UniformGenerationOffcanvas");
    const { changeUniformGenerationSortOrder } = jest.requireMock("@/dal/uniform/generation/_index");
    const { useUniformTypeList } = jest.requireMock("@/dataFetcher/uniformAdmin");

    afterEach(() => {
        jest.clearAllMocks();
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
                    outdated: false,
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
        expect(invalidGenerationRow?.getElementsByTagName("button")[0]).toHaveClass("text-danger");

        // validate valid generation row
        const validGenerationRow = screen.getByRole("row", testType.uniformGenerationList[0]);
        expect(validGenerationRow?.childNodes[0]).not.toHaveClass("text-danger");
        expect(validGenerationRow?.childNodes[1]).not.toHaveClass("text-danger");
        expect(validGenerationRow?.childNodes[2]).not.toHaveClass("text-danger");
        expect(validGenerationRow?.getElementsByTagName("button")[0]).not.toHaveClass("text-danger");
    });

    it('opens the generation offcanvas when clicking the open button', async () => {
        const user = userEvent.setup();
        render(<UniformGenerationTable uniformType={testType} />);

        // open generation offcanvas
        const openButton = screen.getByRole("row", { name: "Test Generation 1" }).getElementsByTagName("button")[0];
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
        const { toast } = jest.requireMock("react-toastify");
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
        const { toast } = jest.requireMock("react-toastify");
        changeUniformGenerationSortOrder.mockImplementationOnce(async () => { throw new Error("Error") });
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
    it('shows outdated column on Mobile when !usingSizes', () => {
        const testTypeWithoutSizeList: UniformType = {
            ...testType,
            usingSizes: false,
        };
        render(<UniformGenerationTable uniformType={testTypeWithoutSizeList} />);

        expect(screen.queryByText("common.uniform.generation.outdated")).toBeInTheDocument();
        expect(screen.queryByText("common.uniform.generation.outdated")).not.toHaveClass("d-none d-sm-table-cell");

        const row = screen.getByRole("row", { name: "Test Generation 1" });
        expect(row).not.toBeNull();
        expect(row?.childNodes[2]).not.toHaveClass("d-none d-sm-table-cell");
    });
    it('hides outdated column on Mobile when usingSizes', () => {
        render(<UniformGenerationTable uniformType={testType} />);

        expect(screen.queryByText("common.uniform.generation.outdated")).toBeInTheDocument();
        expect(screen.queryByText("common.uniform.generation.outdated")).toHaveClass("d-none d-sm-table-cell");

        const row = screen.getByRole("row", { name: "Test Generation 1" });
        expect(row).not.toBeNull();
        expect(row?.childNodes[2]).toHaveClass("d-none d-sm-table-cell");
    });
});