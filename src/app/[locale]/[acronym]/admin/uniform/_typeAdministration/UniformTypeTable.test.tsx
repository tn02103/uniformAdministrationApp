import { UniformType } from "@/types/globalUniformTypes";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testTypes } from "./testTypes";
import { UniformTypeTable } from "./UniformTypeTable";

jest.mock("@/dal/uniform/type/_index", () => ({
    changeUniformTypeSortOrder: jest.fn(),
}));

jest.mock("@/dataFetcher/uniformAdmin", () => {
    const mutateMock = jest.fn();
    return {
        useUniformTypeList: jest.fn(() => ({
            mutate: mutateMock,
            typeList: testTypes,
        })),
    }
});
let onDragEndFunction: undefined | ((newArray: UniformType[], itemId: string) => void) = undefined;
jest.mock("@/components/reorderDnD/ReorderableTableBody", () => {
    return {
        ReorderableTableBody: jest.fn(({ items, itemType, onDragEnd, children }) => {
            onDragEndFunction = onDragEnd;
            return (
                <tbody data-testid="reorderable-table-body">
                    {items.map(((item: any) => children({ item, draggableRef: undefined, previewRef: undefined, isDragging: false })))}
                </tbody>
            )
        }),
    };
});

jest.mock("./UniformTypeOffcanvas", () => ({
    UniformTypeOffcanvas: jest.fn(({ setSelectedTypeId }) => (
        <div data-testid="uniform-type-offcanvas" onClick={() => setSelectedTypeId(null)}>
            UniformTypeOffcanvas
        </div>
    )),
}));


describe("<UniformTypeTable />", () => {
    const { changeUniformTypeSortOrder } = require("@/dal/uniform/type/_index");
    const { useUniformTypeList } = require("@/dataFetcher/uniformAdmin");
    const { UniformTypeOffcanvas } = require("./UniformTypeOffcanvas");
    const mockMutate = useUniformTypeList().mutate;

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should render the component correctly", () => {
        render(<UniformTypeTable initialTypeList={testTypes} />);

        expect(screen.getByRole("table")).toBeInTheDocument();
        expect(screen.getByRole("table").closest('div')).toMatchSnapshot();
    });

    it("should call onDragEnd and change sort order correctly", () => {
        changeUniformTypeSortOrder.mockReturnValue("uniform type sortOrder changed");
        render(<UniformTypeTable initialTypeList={testTypes} />);

        expect(onDragEndFunction).toBeDefined();
        const newArray = [
            testTypes[1],
            testTypes[2],
            testTypes[0],
            testTypes[3],
        ]
        onDragEndFunction?.(newArray, testTypes[0].id);

        expect(changeUniformTypeSortOrder).toHaveBeenCalledWith({ typeId: testTypes[0].id, newPosition: 2 });
        expect(mockMutate).toHaveBeenCalledWith("uniform type sortOrder changed", { optimisticData: newArray });
    });

    it("should not call sortOrder function when itemId is not in the list", () => {
        render(<UniformTypeTable initialTypeList={testTypes} />);

        expect(onDragEndFunction).toBeDefined();
        onDragEndFunction?.([
            testTypes[1],
            testTypes[2],
            testTypes[0],
            testTypes[3],
        ], "invalid-id");

        expect(changeUniformTypeSortOrder).not.toHaveBeenCalled();
    });
    it("should not call sortOrder function when list has wrong size", () => {
        render(<UniformTypeTable initialTypeList={testTypes} />);

        expect(onDragEndFunction).toBeDefined();
        onDragEndFunction?.([
            testTypes[1],
            testTypes[2],
            testTypes[0],
        ], testTypes[0].id);

        expect(changeUniformTypeSortOrder).not.toHaveBeenCalled();
    });

    describe("Render UniformTypeOffcanvas", () => {
        it("should open and close UniformTypeOffcanvas for the correct element", async () => {
            const user = userEvent.setup();
            render(<UniformTypeTable initialTypeList={testTypes} />);

            const openButtons = screen.getAllByRole('button', { name: 'open' });
            expect(openButtons).toHaveLength(4);
            await user.click(openButtons[1]);

            expect(screen.getByTestId("uniform-type-offcanvas")).toBeInTheDocument();
            expect(UniformTypeOffcanvas).toHaveBeenCalledTimes(1);
            expect(UniformTypeOffcanvas).toHaveBeenCalledWith(
                {
                    editable: false,
                    setEditable: expect.any(Function),
                    setSelectedTypeId: expect.any(Function),
                    uniformType: testTypes[1]
                },
                {}
            );
            act(() => {
                UniformTypeOffcanvas.mock.calls[0][0].setSelectedTypeId(null);
            });
            expect(screen.queryByTestId("uniform-type-offcanvas")).not.toBeInTheDocument();
        });

        it("should open UniformTypeOffcanvas to create a new type", async () => {
            const user = userEvent.setup();
            render(<UniformTypeTable initialTypeList={testTypes} />);

            const createButton = screen.getByRole('button', { name: 'create' });
            await user.click(createButton);

            expect(screen.getByTestId("uniform-type-offcanvas")).toBeInTheDocument();
            expect(UniformTypeOffcanvas).toHaveBeenCalledTimes(1);
            expect(UniformTypeOffcanvas).toHaveBeenCalledWith(
                {
                    editable: true,
                    setEditable: expect.any(Function),
                    setSelectedTypeId: expect.any(Function),
                    uniformType: null
                },
                {}
            );

            act(() => {
                UniformTypeOffcanvas.mock.calls[0][0].setSelectedTypeId(null);
            });
            expect(screen.queryByTestId("uniform-type-offcanvas")).not.toBeInTheDocument();
        });

        it("should rerender when selectedTypeId changes", async () => {
            const user = userEvent.setup();
            render(<UniformTypeTable initialTypeList={testTypes} />);

            const createButton = screen.getByRole('button', { name: 'create' });
            await user.click(createButton);

            expect(screen.getByTestId("uniform-type-offcanvas")).toBeInTheDocument();
            expect(UniformTypeOffcanvas).toHaveBeenCalledTimes(1);

            act(() => {
                UniformTypeOffcanvas.mock.calls[0][0].setSelectedTypeId(testTypes[1].id);
            });
            expect(screen.queryByTestId("uniform-type-offcanvas")).toBeInTheDocument();
            expect(UniformTypeOffcanvas).toHaveBeenCalledTimes(2);
            expect(UniformTypeOffcanvas).toHaveBeenCalledWith(
                {
                    editable: true,
                    setEditable: expect.any(Function),
                    setSelectedTypeId: expect.any(Function),
                    uniformType: testTypes[1]
                },
                {}
            );

            act(() => {
                UniformTypeOffcanvas.mock.calls[1][0].setSelectedTypeId(null);
            });
            expect(screen.queryByTestId("uniform-type-offcanvas")).not.toBeInTheDocument();
        });

        it('should change editable when calling function', async () => {
            const user = userEvent.setup();
            render(<UniformTypeTable initialTypeList={testTypes} />);

            // open the offcanvas to edit the second type
            const openButtons = screen.getAllByRole('button', { name: 'open' });
            expect(openButtons).toHaveLength(4);

            await user.click(openButtons[1]);
            expect(screen.getByTestId("uniform-type-offcanvas")).toBeInTheDocument();
            expect(UniformTypeOffcanvas).toHaveBeenCalledTimes(1);
            expect(UniformTypeOffcanvas).toHaveBeenCalledWith(
                {
                    editable: false,
                    setEditable: expect.any(Function),
                    setSelectedTypeId: expect.any(Function),
                    uniformType: testTypes[1]
                },
                {}
            );

            // call the setEditable function to change the editable state
            act(() => {
                UniformTypeOffcanvas.mock.calls[0][0].setEditable(true);
            });
            expect(screen.getByTestId("uniform-type-offcanvas")).toBeInTheDocument();
            expect(UniformTypeOffcanvas).toHaveBeenCalledTimes(2);
            expect(UniformTypeOffcanvas).toHaveBeenLastCalledWith(
                {
                    editable: true,
                    setEditable: expect.any(Function),
                    setSelectedTypeId: expect.any(Function),
                    uniformType: testTypes[1]
                },
                {}
            );

            // validate open and create buttons are disabled
            const openButtonsOnEdit = screen.getAllByRole('button', { name: 'open' });
            const createButtonOnEdit = screen.getByRole('button', { name: 'create' });
            openButtonsOnEdit.forEach(button => {
                expect(button).toBeDisabled();
            });
            expect(createButtonOnEdit).toBeDisabled();

            // call the setEditable function to change the editable state back to false
            act(() => {
                UniformTypeOffcanvas.mock.calls[1][0].setEditable(false);
            });
            expect(screen.getByTestId("uniform-type-offcanvas")).toBeInTheDocument();
            expect(UniformTypeOffcanvas).toHaveBeenCalledTimes(3);
            expect(UniformTypeOffcanvas).toHaveBeenLastCalledWith(
                {
                    editable: false,
                    setEditable: expect.any(Function),
                    setSelectedTypeId: expect.any(Function),
                    uniformType: testTypes[1]
                },
                {}
            );

            // validate open and create buttons are enabled again
            const openButtonsAfterEdit = screen.getAllByRole('button', { name: 'open' });
            const createButtonAfterEdit = screen.getByRole('button', { name: 'create' });
            openButtonsAfterEdit.forEach(button => {
                expect(button).not.toBeDisabled();
            });
            expect(createButtonAfterEdit).not.toBeDisabled();
        });
    });
});
