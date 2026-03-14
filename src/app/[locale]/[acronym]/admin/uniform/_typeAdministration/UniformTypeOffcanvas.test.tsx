import { UniformType } from "@/types/globalUniformTypes";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testTypes } from "./testTypes";
import { UniformTypeOffcanvas } from "./UniformTypeOffcanvas";
import { createUniformType, deleteUniformType, updateUniformType } from "@/dal/uniform/type/_index";
import { useUniformTypeList } from "@/dataFetcher/uniformAdmin";
import { getUniformItemCountByType } from "@/dal/uniform/item/_index";
import { UniformGenerationTable } from "./UniformGenerationTable";
import { useModal } from "@/components/modals/modalProvider";
import { toast } from "react-toastify";
import { vi, type Mock } from 'vitest';

const sizeListIds = [
    'e667d674-7df8-436b-a2b8-77b06e063d36',
    'a961545b-28a7-409e-9200-1d85ccd53522',
    '07de1d59-4fc6-447b-98a6-da916e5792ef',
];
const testType: UniformType = testTypes[0]

// ################## MOCKS ##################
vi.mock("@/dataFetcher/uniformAdmin", () => {
    const typeListMutate = vi.fn(async (a) => a);
    return {
        useUniformSizelists: vi.fn(() => ({
            sizelistList: [{ id: sizeListIds[0], name: "Test Size List" }, { id: sizeListIds[1], name: "Test Size List 2" }, { id: sizeListIds[2], name: "Test Size List 3" }],
        })),
        useUniformTypeList: vi.fn(() => ({
            mutate: typeListMutate,
            typeList: testTypes,
        })),
    };
});

vi.mock("@/dal/uniform/type/_index", () => {
    return {
        createUniformType: vi.fn(async () => ({ id: 'new-type-id' })),
        deleteUniformType: vi.fn(() => "uniform type deleted"),
        updateUniformType: vi.fn(async () => "uniform type updated"),
    };
});
vi.mock("@/dal/uniform/item/_index", () => {
    const mock = vi.fn(async () => ({ count: 10 }));
    return {
        getUniformItemCountByType: mock,
    };
});

vi.mock("./UniformGenerationTable", () => {
    const mock = vi.fn(() => <div data-testid="generationTableMock">Generation Table</div>);
    return {
        UniformGenerationTable: mock,
    };
});

// ############## TESTS ##################
describe('<UniformTypeOffcanvas />', () => {
    const mutate = useUniformTypeList().mutate;

    afterEach(() => vi.clearAllMocks());

    it('renders the component and handles setEditable', async () => {
        const setEditable = vi.fn();
        render(
            <UniformTypeOffcanvas
                uniformType={testType}
                editable={true}
                setEditable={setEditable}
                setSelectedTypeId={vi.fn()}
            />
        );

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toMatchSnapshot();
    });

    it('resets the form values and calls setEditable on cancel', async () => {
        const user = userEvent.setup();
        const setEditable = vi.fn();
        const setSelectedTypeId = vi.fn();
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

    it('renders correct layout when no uniformType is provided', () => {
        render(
            <UniformTypeOffcanvas
                uniformType={null}
                editable={true}
                setEditable={vi.fn()}
                setSelectedTypeId={vi.fn()}
            />
        );

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toMatchSnapshot();
        expect(screen.queryByRole('textbox', { name: 'common.name' })).not.toBeInTheDocument();
    });

    it('hides default sizelist if usingSizes is false', async () => {
        const user = userEvent.setup();
        const setEditable = vi.fn();

        // render not editable
        const { unmount } = render(
            <UniformTypeOffcanvas
                uniformType={{
                    ...testType,
                    usingSizes: false,
                }}
                editable={false}
                setEditable={setEditable}
                setSelectedTypeId={vi.fn()}
            />
        );

        expect(screen.queryByRole('combobox', { name: 'common.uniform.type.defaultSizelist' })).not.toBeInTheDocument();
        expect(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' })).toHaveAttribute('aria-checked', 'false');

        // render editable
        unmount();
        render(
            <UniformTypeOffcanvas
                uniformType={{
                    ...testType,
                    usingSizes: false,
                }}
                editable={true}
                setEditable={setEditable}
                setSelectedTypeId={vi.fn()}
            />
        );

        // validate !usingSizes
        expect(screen.queryByRole('combobox', { name: 'common.uniform.type.defaultSizelist' })).not.toBeInTheDocument();
        expect(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' })).toHaveAttribute('aria-checked', 'false');

        // toggle switch to true
        await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' }));
        expect(screen.getByRole('combobox', { name: 'common.uniform.type.defaultSizelist' })).toBeInTheDocument();
        expect(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' })).toHaveAttribute('aria-checked', 'true');

    });

    it('does not show generation table if !usingGenerations', () => {
        const setEditable = vi.fn();
        render(
            <UniformTypeOffcanvas
                uniformType={{
                    ...testType,
                    usingGenerations: false,
                }}
                editable={false}
                setEditable={setEditable}
                setSelectedTypeId={vi.fn()}
            />
        );

        expect(screen.queryByTestId('generationTableMock')).not.toBeInTheDocument();
        expect(screen.getByRole('switch', { name: 'common.uniform.type.usingGenerations' })).toHaveAttribute('aria-checked', 'false');
    });

    it('passes uniformType to UniformGenerationTable', () => {
        const setEditable = vi.fn();
        render(
            <UniformTypeOffcanvas
                uniformType={testType}
                editable={false}
                setEditable={setEditable}
                setSelectedTypeId={vi.fn()}
            />
        );

        expect(screen.getByTestId('generationTableMock')).toBeInTheDocument();
        expect(UniformGenerationTable).toHaveBeenCalledWith({ uniformType: testType }, undefined);
    });

    describe('dal-Methods', () => {
        const { dangerConfirmationModal } = useModal()!;
        describe('deleteUniformType', () => {
            it('deletes successfuly', async () => {
                const user = userEvent.setup();
                const setSelectedTypeId = vi.fn();

                render(
                    <UniformTypeOffcanvas
                        uniformType={testType}
                        editable={false}
                        setEditable={vi.fn()}
                        setSelectedTypeId={setSelectedTypeId}
                    />
                );

                // open danger confirmation modal
                const deleteButton = screen.getByRole('button', { name: 'common.actions.delete' });
                await user.click(deleteButton);

                // validate modal
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

                // call delete function
                await (dangerConfirmationModal as unknown as Mock).mock.calls[0][0].dangerOption.function();

                // validate success handling
                expect(deleteUniformType).toHaveBeenCalledTimes(1);
                expect(deleteUniformType).toHaveBeenCalledWith(testType.id);
                expect(mutate).toHaveBeenCalledTimes(1);
                expect(mutate).toHaveBeenCalledWith("uniform type deleted");
                expect(setSelectedTypeId).toHaveBeenCalledWith(null);
            });

            it('catch DAL Exception', async () => {
                const user = userEvent.setup();
                const setSelectedTypeId = vi.fn();
                (deleteUniformType as Mock).mockImplementationOnce(async () => { throw new Error("custom.error") });

                render(
                    <UniformTypeOffcanvas
                        uniformType={testType}
                        editable={false}
                        setEditable={vi.fn()}
                        setSelectedTypeId={setSelectedTypeId}
                    />
                );

                // open danger confirmation modal
                const deleteButton = screen.getByRole('button', { name: 'common.actions.delete' });
                await user.click(deleteButton);

                // validate modal
                expect(getUniformItemCountByType).toHaveBeenCalledTimes(1);
                expect(dangerConfirmationModal).toHaveBeenCalled();

                // call delete function
                await (dangerConfirmationModal as unknown as Mock).mock.calls[0][0].dangerOption.function();

                // validate exception handling
                expect(deleteUniformType).toHaveBeenCalledTimes(1);
                expect(mutate).toHaveBeenCalledTimes(1);
                expect(mutate).not.toHaveBeenCalledWith("uniform type deleted");

                expect(toast.error).toHaveBeenCalledTimes(1);
                expect(toast.error).toHaveBeenCalledWith("common.error.actions.delete");
            });
        });

        describe('createUniformType', () => {
            it('creates successfuly', async () => {
                const user = userEvent.setup();
                const setEditable = vi.fn();
                const setSelectedTypeId = vi.fn();
                render(
                    <UniformTypeOffcanvas
                        uniformType={null}
                        editable={true}
                        setEditable={setEditable}
                        setSelectedTypeId={setSelectedTypeId}
                    />
                );

                // fill form and submit
                await user.type(screen.getByRole('textbox', { name: 'common.name *' }), 'New Type');
                await user.type(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' }), 'NT');
                await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' }));
                await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingGenerations' }));
                await user.type(screen.getByRole('spinbutton', { name: 'common.uniform.type.issuedDefault' }), '3');
                await user.selectOptions(screen.getByRole('combobox', { name: 'common.uniform.type.defaultSizelist' }), sizeListIds[0]);
                await user.click(screen.getByRole('button', { name: 'common.actions.create' }));

                // validate success handling
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
                expect(mutate).toHaveBeenCalledTimes(1);
                expect(mutate).toHaveBeenCalledWith();
                expect(setEditable).toHaveBeenCalledWith(false);
                expect(setSelectedTypeId).toHaveBeenCalledWith('new-type-id');
            });
            it('catches name and acronym errors', async () => {
                const user = userEvent.setup();
                const setEditable = vi.fn();
                render(
                    <UniformTypeOffcanvas
                        uniformType={null}
                        editable={true}
                        setEditable={setEditable}
                        setSelectedTypeId={vi.fn()}
                    />
                );

                const nameInput = screen.getByRole('textbox', { name: 'common.name *' });
                const acronymInput = screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' });
                const issuedDefaultInput = screen.getByRole('spinbutton', { name: 'common.uniform.type.issuedDefault' });

                // mock name duplication error
                (createUniformType as Mock).mockImplementationOnce(async () => ({
                    error: {
                        message: "custom.uniform.type.nameDuplication",
                        formElement: "name",
                    }
                }));

                // fill form and submit
                await user.type(nameInput, 'New Type');
                await user.type(acronymInput, 'NT');
                await user.type(issuedDefaultInput, '3');
                await user.click(screen.getByRole('button', { name: 'common.actions.create' }));

                // validate error handling
                expect(createUniformType).toHaveBeenCalled();
                expect(mutate).not.toHaveBeenCalled();
                expect(setEditable).not.toHaveBeenCalled();

                // validate error shown
                const nameError = screen.queryByRole('alert', { name: 'error message name' });
                expect(nameError).toBeInTheDocument();
                expect(nameError).toHaveTextContent('custom.uniform.type.nameDuplication');
                expect(nameInput).toHaveAttribute('aria-invalid', 'true');
                expect(nameInput).toHaveClass('is-invalid');

                // change data in name and validate error not shown
                await user.type(nameInput, '2');
                expect(nameError).toHaveTextContent('');
                expect(nameInput).toHaveAttribute('aria-invalid', 'false');
                expect(nameInput).not.toHaveClass('is-invalid');

                // mock acronym duplication error
                (createUniformType as Mock).mockImplementationOnce(async () => ({
                    error: {
                        message: "custom.uniform.type.acronymDuplication;name:Test Type",
                        formElement: "acronym",
                    }
                }));

                // submit and validate error handling
                await user.click(screen.getByRole('button', { name: 'common.actions.create' }));
                expect(createUniformType).toHaveBeenCalledTimes(2);
                expect(mutate).not.toHaveBeenCalled();
                expect(setEditable).not.toHaveBeenCalled();

                // validate error shown
                expect(screen.getByRole('alert', { name: 'error message acronym' })).toBeInTheDocument();
                expect(screen.getByRole('alert', { name: 'error message acronym' })).toHaveTextContent('custom.uniform.type.acronymDuplication;name:Test Type');
                expect(acronymInput).toHaveAttribute('aria-invalid', 'true');
                expect(acronymInput).toHaveClass('is-invalid');
            });

            it('catchs DAL exception', async () => {
                (createUniformType as Mock).mockImplementationOnce(async () => { throw new Error("custom.error") });
                const user = userEvent.setup();
                const setEditable = vi.fn();
                const setSelectedTypeId = vi.fn();
                render(
                    <UniformTypeOffcanvas
                        uniformType={null}
                        editable={true}
                        setEditable={setEditable}
                        setSelectedTypeId={setSelectedTypeId}
                    />
                );

                // fill form and submit
                await user.type(screen.getByRole('textbox', { name: 'common.name *' }), 'New Type');
                await user.type(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' }), 'NT');
                await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' }));
                await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingGenerations' }));
                await user.type(screen.getByRole('spinbutton', { name: 'common.uniform.type.issuedDefault' }), '3');
                await user.selectOptions(screen.getByRole('combobox', { name: 'common.uniform.type.defaultSizelist' }), sizeListIds[0]);
                await user.click(screen.getByRole('button', { name: 'common.actions.create' }));

                // validate exception handling
                expect(createUniformType).toHaveBeenCalledTimes(1);
                expect(mutate).not.toHaveBeenCalled();
                expect(setEditable).not.toHaveBeenCalled();
                expect(setSelectedTypeId).not.toHaveBeenCalled();

                expect(toast.error).toHaveBeenCalledTimes(1);
                expect(toast.error).toHaveBeenCalledWith("common.error.actions.create");
            });
        });

        describe('updateUniformType', () => {
            it('updates successfully', async () => {
                const user = userEvent.setup();
                const setEditable = vi.fn();
                render(
                    <UniformTypeOffcanvas
                        uniformType={testType}
                        editable={true}
                        setEditable={setEditable}
                        setSelectedTypeId={vi.fn()}
                    />
                );

                // fill form 
                await user.clear(screen.getByRole('textbox', { name: 'common.name *' }));
                await user.type(screen.getByRole('textbox', { name: 'common.name *' }), 'Updated');
                await user.clear(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' }));
                await user.type(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' }), 'UT');
                await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' }));
                await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingGenerations' }));
                await user.clear(screen.getByRole('spinbutton', { name: 'common.uniform.type.issuedDefault' }));
                await user.type(screen.getByRole('spinbutton', { name: 'common.uniform.type.issuedDefault' }), '5');

                // submit
                await user.click(screen.getByRole('button', { name: 'common.actions.save' }));

                // validate success handling
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
                expect(mutate).toHaveBeenCalledTimes(1);
                expect(mutate).toHaveBeenCalledWith("uniform type updated");
                expect(setEditable).toHaveBeenCalledWith(false);
            });

            it('catches name and acronym errors', async () => {
                const user = userEvent.setup();
                const setEditable = vi.fn();
                render(
                    <UniformTypeOffcanvas
                        uniformType={testType}
                        editable={true}
                        setEditable={setEditable}
                        setSelectedTypeId={vi.fn()}
                    />
                );

                // mock name duplication error
                (updateUniformType as Mock).mockImplementationOnce(async () => ({
                    error: {
                        message: "custom.uniform.type.nameDuplication",
                        formElement: "name",
                    }
                }));

                // submit and validate error handling
                await user.click(screen.getByRole('button', { name: 'common.actions.save' }));
                expect(updateUniformType).toHaveBeenCalled();
                expect(mutate).not.toHaveBeenCalled();
                expect(setEditable).not.toHaveBeenCalled();

                // validate error shown
                expect(screen.getByRole('alert', { name: 'error message name' })).toBeInTheDocument();
                expect(screen.getByRole('alert', { name: 'error message name' })).toHaveTextContent('custom.uniform.type.nameDuplication');
                expect(screen.getByRole('textbox', { name: 'common.name *' })).toHaveAttribute('aria-invalid', 'true');
                expect(screen.getByRole('textbox', { name: 'common.name *' })).toHaveClass('is-invalid');

                // change data in name and validate error not shown
                await user.type(screen.getByRole('textbox', { name: 'common.name *' }), '2');
                expect(screen.getByRole('alert', { name: 'error message name' })).toHaveTextContent('');
                expect(screen.getByRole('textbox', { name: 'common.name *' })).toHaveAttribute('aria-invalid', 'false');
                expect(screen.getByRole('textbox', { name: 'common.name *' })).not.toHaveClass('is-invalid');

                // mock acronym duplication error
                (updateUniformType as Mock).mockImplementationOnce(async () => ({
                    error: {
                        message: "custom.uniform.type.acronymDuplication;name:Test Type",
                        formElement: "acronym",
                    }
                }));

                // submit and validate error handling
                await user.click(screen.getByRole('button', { name: 'common.actions.save' }));
                expect(updateUniformType).toHaveBeenCalledTimes(2);
                expect(mutate).not.toHaveBeenCalled();
                expect(setEditable).not.toHaveBeenCalled();

                // validate error shown
                expect(screen.getByRole('alert', { name: 'error message acronym' })).toBeInTheDocument();
                expect(screen.getByRole('alert', { name: 'error message acronym' })).toHaveTextContent('custom.uniform.type.acronymDuplication;name:Test Type');
                expect(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' })).toHaveAttribute('aria-invalid', 'true');
                expect(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' })).toHaveClass('is-invalid');
            });
            it('catches DAL exception', async () => {
                (updateUniformType as Mock).mockImplementationOnce(async () => { throw new Error("custom.error") });
                const user = userEvent.setup();
                const setEditable = vi.fn();
                render(
                    <UniformTypeOffcanvas
                        uniformType={testType}
                        editable={true}
                        setEditable={setEditable}
                        setSelectedTypeId={vi.fn()}
                    />
                );
                // submit
                await user.click(screen.getByRole('button', { name: 'common.actions.save' }));

                // validate exception handling
                expect(updateUniformType).toHaveBeenCalledTimes(1);
                expect(mutate).not.toHaveBeenCalled();
                expect(setEditable).not.toHaveBeenCalled();

                expect(toast.error).toHaveBeenCalledTimes(1);
                expect(toast.error).toHaveBeenCalledWith("common.error.actions.save");
            });
        });
        it('should only allow defaultSizelist null if !usingSizes', async () => {
            const user = userEvent.setup();
            render(
                <UniformTypeOffcanvas
                    uniformType={null}
                    editable={true}
                    setEditable={vi.fn()}
                    setSelectedTypeId={vi.fn()}
                />
            );

            // using sizes without default sizelist
            await user.type(screen.getByRole('textbox', { name: 'common.name *' }), 'New Type');
            await user.type(screen.getByRole('textbox', { name: 'common.uniform.type.acronym *' }), 'NT');
            await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' }));
            await user.type(screen.getByRole('spinbutton', { name: 'common.uniform.type.issuedDefault' }), '3');
            expect(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' })).toHaveAttribute('aria-checked', 'true');

            // submit and validate error handling
            await user.click(screen.getByRole('button', { name: 'common.actions.create' }));
            expect(createUniformType).not.toHaveBeenCalled();
            expect(screen.getByRole('alert', { name: 'error message fk_defaultSizelist' })).toBeInTheDocument();
            expect(screen.getByRole('alert', { name: 'error message fk_defaultSizelist' })).toHaveTextContent('pleaseSelect');
            expect(screen.getByRole('combobox', { name: 'common.uniform.type.defaultSizelist' })).toHaveAttribute('aria-invalid', 'true');

            // set usingSizes to false
            await user.click(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' }));
            expect(screen.getByRole('switch', { name: 'common.uniform.type.usingSizes' })).toHaveAttribute('aria-checked', 'false');

            // submit and validate success handling
            await user.click(screen.getByRole('button', { name: 'common.actions.create' }));
            expect(createUniformType).toHaveBeenCalledTimes(1);
        });
    });
});
