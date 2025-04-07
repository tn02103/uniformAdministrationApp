import { UniformType } from "@/types/globalUniformTypes";
import { render, screen } from "@testing-library/react";
import { UniformTypeOffcanvas } from "./UniformTypeOffcanvas";
import userEvent from "@testing-library/user-event";

const sizeListIds = [
    'e667d674-7df8-436b-a2b8-77b06e063d36',
    'a961545b-28a7-409e-9200-1d85ccd53522',
    '07de1d59-4fc6-447b-98a6-da916e5792ef',
];
const typeListIds = [
    '6c758780-baeb-4fd3-9a92-a318c0306431',
    '38abce89-e34d-4487-b611-2d3d5d9826f5',
    '3dad8936-9537-402e-b878-a1c955ecea63'
]

const testType: UniformType = {
    id: typeListIds[0],
    name: "Test Type",
    acronym: "TT",
    sortOrder: 1,
    usingSizes: true,
    usingGenerations: true,
    issuedDefault: 2,
    fk_defaultSizelist: sizeListIds[0],
    defaultSizelist: {
        id: sizeListIds[0],
        name: "Test Size List",
    },
    uniformGenerationList: [],
}


jest.mock("@/dataFetcher/uniformAdmin", () => {
    const typeListMutate = jest.fn(async () => { });
    return {
        useUniformSizelists: jest.fn(() => ({
            sizelistList: [{ id: sizeListIds[0], name: "Test Size List" }, { id: sizeListIds[1], name: "Test Size List 2" }, { id: sizeListIds[2], name: "Test Size List 3" }],
        })),
        useUniformTypeList: jest.fn(() => ({
            mutate: typeListMutate,
            typeList: [
                { id: typeListIds[0], name: "Test Type 1" },
                { id: typeListIds[1], name: "Test Type 2" },
                { id: typeListIds[2], name: "Test Type 3" },
            ],
        })),
    };
});

jest.mock("@/dal/uniform/type/_index", () => {
    return {
        createUniformType: jest.fn(async () => ({ id: 'new-type-id' })),
        deleteUniformType: jest.fn(async () => "uniform type deleted"),
        updateUniformType: jest.fn(async () => "uniform type updated"),
    };
});
jest.mock("@/dal/uniform/item/_index", () => {
    const mock = jest.fn(async () => ({ count: 10 }));
    return {
        getUniformItemCountByType: mock,
    };
});

jest.mock("./UniformGenerationTable", () => {
    const mock = jest.fn(() => <div data-testid="generationTableMock">Generation Table</div>);
    return {
        UniformGenerationTable: mock,
    };
});

describe('<UniformTypeOffcanvas />', () => {
    const { createUniformType, deleteUniformType, updateUniformType } = require('@/dal/uniform/type/_index');
    const { useUniformTypeList } = require('@/dataFetcher/uniformAdmin');
    const { useModal } = require('@/components/modals/modalProvider');
    const { getUniformItemCountByType } = require('@/dal/uniform/item/_index');
    const { UniformGenerationTable } = require('./UniformGenerationTable');

    afterEach(() => jest.clearAllMocks());

    it('should render the component and handle setEditable', async () => {
        const user = userEvent.setup();
        const setEditable = jest.fn();
        render(
            <UniformTypeOffcanvas
                uniformType={testType}
                editable={false}
                setEditable={setEditable}
                setSelectedTypeId={jest.fn()}
            />
        );

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toMatchSnapshot();

        const editButton = screen.getByRole('button', { name: 'common.actions.edit' });
        await user.click(editButton);
        expect(setEditable).toHaveBeenCalledWith(true);
    });

    it('should handle editable states correctly', async () => {
        const setEditable = jest.fn();
        render(
            <UniformTypeOffcanvas
                uniformType={testType}
                editable={true}
                setEditable={setEditable}
                setSelectedTypeId={jest.fn()}
            />
        );

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toMatchSnapshot();
    });

    it('should reset the form values and call setEditable with false on cancel', async () => {
        const user = userEvent.setup();
        const setEditable = jest.fn();
        const setSelectedTypeId = jest.fn();
        render(
            <UniformTypeOffcanvas
                uniformType={testType}
                editable={true}
                setEditable={setEditable}
                setSelectedTypeId={setSelectedTypeId}
            />
        );

        const nameInput = screen.getByRole('textbox', { name: 'common.name *' });
        const acronymInput = screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' });

        // Modify form values
        await user.clear(nameInput);
        await user.type(nameInput, 'Modified Name');
        await user.clear(acronymInput);
        await user.type(acronymInput, 'MN');

        // Trigger cancel
        const cancelButton = screen.getByRole('button', { name: 'common.actions.cancel' });
        await user.click(cancelButton);

        // Assert form reset
        expect(nameInput).toHaveValue(testType.name);
        expect(acronymInput).toHaveValue(testType.acronym);

        // Assert setEditable called with false
        expect(setEditable).toHaveBeenCalledWith(false);
    });

    it('should render correct layout when no uniformType is provided', () => {
        render(
            <UniformTypeOffcanvas
                uniformType={null}
                editable={true}
                setEditable={jest.fn()}
                setSelectedTypeId={jest.fn()}
            />
        );

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toMatchSnapshot();
        expect(screen.queryByRole('textbox', { name: 'common.name' })).not.toBeInTheDocument();
    });

    it('should hide default sizelist if usingSizes is false', async () => {
        const user = userEvent.setup();
        const setEditable = jest.fn();
        const { unmount } = render(
            <UniformTypeOffcanvas
                uniformType={{
                    ...testType,
                    usingSizes: false,
                }}
                editable={false}
                setEditable={setEditable}
                setSelectedTypeId={jest.fn()}
            />
        );

        expect(screen.queryByRole('combobox', { name: 'common.uniform.type.defaultSizelist' })).not.toBeInTheDocument();
        expect(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' })).toHaveAttribute('aria-checked', 'false');

        unmount();
        render(
            <UniformTypeOffcanvas
                uniformType={{
                    ...testType,
                    usingSizes: false,
                }}
                editable={true}
                setEditable={setEditable}
                setSelectedTypeId={jest.fn()}
            />
        );

        expect(screen.queryByRole('combobox', { name: 'common.uniform.type.defaultSizelist' })).not.toBeInTheDocument();
        expect(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' })).toHaveAttribute('aria-checked', 'false');

        await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' }));
        expect(screen.getByRole('combobox', { name: 'common.uniform.type.defaultSizelist' })).toBeInTheDocument();
        expect(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' })).toHaveAttribute('aria-checked', 'true');
    });

    it('should not show generation table if not usingGenerations', () => {
        const setEditable = jest.fn();
        render(
            <UniformTypeOffcanvas
                uniformType={{
                    ...testType,
                    usingGenerations: false,
                }}
                editable={false}
                setEditable={setEditable}
                setSelectedTypeId={jest.fn()}
            />
        );

        expect(screen.queryByTestId('generationTableMock')).not.toBeInTheDocument();
        expect(screen.getByRole('switch', { name: 'common.uniform.type.usingGenerations' })).toHaveAttribute('aria-checked', 'false');
    });

    it('should pass uniformType to UniformGenerationTable', () => {
        const setEditable = jest.fn();
        render(
            <UniformTypeOffcanvas
                uniformType={testType}
                editable={false}
                setEditable={setEditable}
                setSelectedTypeId={jest.fn()}
            />
        );

        expect(screen.getByTestId('generationTableMock')).toBeInTheDocument();
        expect(UniformGenerationTable).toHaveBeenCalledWith({ uniformType: testType }, {});
    });

    describe('dal-Methods', () => {

        it('should call deleteUniformType DAL method', async () => {
            const user = userEvent.setup();
            deleteUniformType.mockReturnValue('uniform type deleted');
            const setSelectedTypeId = jest.fn();

            let dangerOption;
            const { dangerConfirmationModal } = useModal();
            dangerConfirmationModal.mockImplementation((option: any) => dangerOption = option.dangerOption);
            const { mutate } = useUniformTypeList();

            render(
                <UniformTypeOffcanvas
                    uniformType={testType}
                    editable={false}
                    setEditable={jest.fn()}
                    setSelectedTypeId={setSelectedTypeId}
                />
            );

            const deleteButton = screen.getByRole('button', { name: 'common.actions.delete' });
            await user.click(deleteButton);

            expect(getUniformItemCountByType).toHaveBeenCalledTimes(1);
            expect(getUniformItemCountByType).toHaveBeenCalledWith(testType.id);
            expect(dangerConfirmationModal).toHaveBeenCalledWith({
                header: 'admin.uniform.type.deleteModal.header',
                message: expect.anything(),
                confirmationText: 'admin.uniform.type.deleteModal.confirmationText',
                dangerOption: {
                    option: 'common.actions.delete',
                    function: expect.any(Function),
                },
            });
            expect(dangerOption).toBeDefined();
            await dangerOption!.function();

            expect(deleteUniformType).toHaveBeenCalledTimes(1);
            expect(deleteUniformType).toHaveBeenCalledWith(testType.id);
            expect(mutate).toHaveBeenCalledTimes(1);
            expect(mutate).toHaveBeenCalledWith("uniform type deleted", {
                optimisticData: [
                    { id: typeListIds[1], name: "Test Type 2" },
                    { id: typeListIds[2], name: "Test Type 3" },
                ],
            });
            expect(setSelectedTypeId).toHaveBeenCalledWith(null);
        });

        it('should call createUniformType DAL method', async () => {
            const user = userEvent.setup();
            const setEditable = jest.fn();
            const setSelectedTypeId = jest.fn();
            render(
                <UniformTypeOffcanvas
                    uniformType={null}
                    editable={true}
                    setEditable={setEditable}
                    setSelectedTypeId={setSelectedTypeId}
                />
            );

            await user.type(screen.getByRole('textbox', { name: 'common.name *' }), 'New Type');
            await user.type(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' }), 'NT');
            await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' }));
            await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingGenerations' }));
            await user.type(screen.getByRole('spinbutton', { name: 'common.uniform.type.issuedDefault' }), '3');
            await user.selectOptions(screen.getByRole('combobox', { name: 'common.uniform.type.defaultSizelist' }), sizeListIds[0]);
            await user.click(screen.getByRole('button', { name: 'common.actions.create' }));

            expect(createUniformType).toHaveBeenCalledTimes(1);
            expect(createUniformType).toHaveBeenCalledWith({
                name: 'New Type',
                acronym: 'NT',
                usingSizes: true,
                usingGenerations: true,
                issuedDefault: 3,
                fk_defaultSizelist: sizeListIds[0],
            });
            expect(updateUniformType).not.toHaveBeenCalled();
            expect(useUniformTypeList().mutate).toHaveBeenCalledTimes(1);
            expect(useUniformTypeList().mutate).toHaveBeenCalledWith();
            expect(setEditable).toHaveBeenCalledWith(false);
            expect(setSelectedTypeId).toHaveBeenCalledWith('new-type-id');
        });


        it('should call updateUniformType DAL method', async () => {
            const user = userEvent.setup();
            const setEditable = jest.fn();
            render(
                <UniformTypeOffcanvas
                    uniformType={testType}
                    editable={true}
                    setEditable={setEditable}
                    setSelectedTypeId={jest.fn()}
                />
            );

            await user.clear(screen.getByRole('textbox', { name: 'common.name *' }));
            await user.type(screen.getByRole('textbox', { name: 'common.name *' }), 'Updated');
            await user.clear(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' }));
            await user.type(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' }), 'UT');
            await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' }));
            await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingGenerations' }));
            await user.clear(screen.getByRole('spinbutton', { name: 'common.uniform.type.issuedDefault' }));
            await user.type(screen.getByRole('spinbutton', { name: 'common.uniform.type.issuedDefault' }), '5');

            await user.click(screen.getByRole('button', { name: 'common.actions.save' }));

            expect(updateUniformType).toHaveBeenCalledTimes(1);
            expect(updateUniformType).toHaveBeenCalledWith({
                id: testType.id,
                data: {
                    name: 'Updated',
                    acronym: 'UT',
                    usingSizes: false,
                    usingGenerations: false,
                    issuedDefault: 5,
                    fk_defaultSizelist: testType.fk_defaultSizelist,
                },
            });
            expect(createUniformType).not.toHaveBeenCalled();
            expect(useUniformTypeList().mutate).toHaveBeenCalledTimes(1);
            expect(useUniformTypeList().mutate).toHaveBeenCalledWith("uniform type updated");
            expect(setEditable).toHaveBeenCalledWith(false);
        });

        it('should catch name and acronym errors for save', async () => {
            const user = userEvent.setup();
            const setEditable = jest.fn();
            render(
                <UniformTypeOffcanvas
                    uniformType={testType}
                    editable={true}
                    setEditable={setEditable}
                    setSelectedTypeId={jest.fn()}
                />
            );

            updateUniformType.mockImplementationOnce(() => ({
                error: {
                    message: "custom.uniform.type.nameDuplication",
                    formElement: "name",
                }
            }));
            await user.click(screen.getByRole('button', { name: 'common.actions.save' }));

            expect(updateUniformType).toHaveBeenCalled();
            expect(useUniformTypeList().mutate).not.toHaveBeenCalled();
            expect(setEditable).not.toHaveBeenCalled();

            expect(screen.getByRole('alert', { name: 'error message name' })).toBeInTheDocument();
            expect(screen.getByRole('alert', { name: 'error message name' })).toHaveTextContent('custom.uniform.type.nameDuplication');
            expect(screen.getByRole('textbox', { name: 'common.name *' })).toHaveAttribute('aria-invalid', 'true');
            expect(screen.getByRole('textbox', { name: 'common.name *' })).toHaveClass('is-invalid');


            updateUniformType.mockImplementationOnce(() => ({
                error: {
                    message: "custom.uniform.type.acronymDuplication;name:Test Type",
                    formElement: "acronym",
                }
            }));
            await user.clear(screen.getByRole('textbox', { name: 'common.name *' }));
            await user.type(screen.getByRole('textbox', { name: 'common.name *' }), 'New Type');
            await user.click(screen.getByRole('button', { name: 'common.actions.save' }));

            expect(updateUniformType).toHaveBeenCalledTimes(2);
            expect(useUniformTypeList().mutate).not.toHaveBeenCalled();
            expect(setEditable).not.toHaveBeenCalled();

            expect(screen.getByRole('alert', { name: 'error message acronym' })).toBeInTheDocument();
            expect(screen.getByRole('alert', { name: 'error message acronym' })).toHaveTextContent('custom.uniform.type.acronymDuplication;name:Test Type');
            expect(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' })).toHaveAttribute('aria-invalid', 'true');
            expect(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' })).toHaveClass('is-invalid');
        });

        it('should catch name and acronym errors for create', async () => {
            const user = userEvent.setup();
            const setEditable = jest.fn();
            render(
                <UniformTypeOffcanvas
                    uniformType={null}
                    editable={true}
                    setEditable={setEditable}
                    setSelectedTypeId={jest.fn()}
                />
            );

            createUniformType.mockImplementationOnce(() => ({
                error: {
                    message: "custom.uniform.type.nameDuplication",
                    formElement: "name",
                }
            }));

            await user.type(screen.getByRole('textbox', { name: 'common.name *' }), 'New Type');
            await user.type(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' }), 'NT');
            await user.type(screen.getByRole('spinbutton', { name: 'common.uniform.type.issuedDefault' }), '3');
            await user.click(screen.getByRole('button', { name: 'common.actions.create' }));


            expect(createUniformType).toHaveBeenCalled();
            expect(useUniformTypeList().mutate).not.toHaveBeenCalled();
            expect(setEditable).not.toHaveBeenCalled();

            expect(screen.getByRole('alert', { name: 'error message name' })).toBeInTheDocument();
            expect(screen.getByRole('alert', { name: 'error message name' })).toHaveTextContent('custom.uniform.type.nameDuplication');
            expect(screen.getByRole('textbox', { name: 'common.name *' })).toHaveAttribute('aria-invalid', 'true');
            expect(screen.getByRole('textbox', { name: 'common.name *' })).toHaveClass('is-invalid');


            createUniformType.mockImplementationOnce(() => ({
                error: {
                    message: "custom.uniform.type.acronymDuplication;name:Test Type",
                    formElement: "acronym",
                }
            }));
            await user.clear(screen.getByRole('textbox', { name: 'common.name *' }));
            await user.type(screen.getByRole('textbox', { name: 'common.name *' }), 'New Type');
            await user.click(screen.getByRole('button', { name: 'common.actions.create' }));

            expect(createUniformType).toHaveBeenCalledTimes(2);
            expect(useUniformTypeList().mutate).not.toHaveBeenCalled();
            expect(setEditable).not.toHaveBeenCalled();

            expect(screen.getByRole('alert', { name: 'error message acronym' })).toBeInTheDocument();
            expect(screen.getByRole('alert', { name: 'error message acronym' })).toHaveTextContent('custom.uniform.type.acronymDuplication;name:Test Type');
            expect(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' })).toHaveAttribute('aria-invalid', 'true');
            expect(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' })).toHaveClass('is-invalid');
        });

        it('should only allow defaultSizelist null if usingSizes is false', async () => {
            const user = userEvent.setup();
            render(
                <UniformTypeOffcanvas
                    uniformType={null}
                    editable={true}
                    setEditable={jest.fn()}
                    setSelectedTypeId={jest.fn()}
                />
            );

            await user.type(screen.getByRole('textbox', { name: 'common.name *' }), 'New Type');
            await user.type(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' }), 'NT');
            await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' }));
            await user.type(screen.getByRole('spinbutton', { name: 'common.uniform.type.issuedDefault' }), '3');

            expect(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' })).toHaveAttribute('aria-checked', 'true');

            await user.click(screen.getByRole('button', { name: 'common.actions.create' }));
            expect(createUniformType).not.toHaveBeenCalled();
            expect(screen.getByRole('alert', { name: 'error message fk_defaultSizelist' })).toBeInTheDocument();
            expect(screen.getByRole('alert', { name: 'error message fk_defaultSizelist' })).toHaveTextContent('pleaseSelect');
            expect(screen.getByRole('combobox', { name: 'common.uniform.type.defaultSizelist' })).toHaveAttribute('aria-invalid', 'true');

            await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' }));
            expect(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' })).toHaveAttribute('aria-checked', 'false');

            await user.click(screen.getByRole('button', { name: 'common.actions.create' }));
            expect(createUniformType).toHaveBeenCalledTimes(1);
        });
    });
});
