import { UniformgenerationOffcanvas } from "@/app/[locale]/[acronym]/admin/uniform/_typeOffcanvas/UniformGenerationOffcanvas";
import { render, screen } from "@testing-library/react";
import user from "@testing-library/user-event";


const sizeListIds = [
    'e667d674-7df8-436b-a2b8-77b06e063d36',
    'a961545b-28a7-409e-9200-1d85ccd53522',
    '07de1d59-4fc6-447b-98a6-da916e5792ef',
]
const uniformTypeId = '2b255769-2154-479f-bfca-c6a49e523334';
const testGeneration = {
    id: "testId",
    name: "Test Generation",
    outdated: false,
    fk_sizelist: sizeListIds[0],
    sortOrder: 0,
    sizelist: {
        id: sizeListIds[0],
        name: "Test Size List",
    },
}


jest.mock("@/dataFetcher/uniformAdmin", () => {
    const typeListMutate = jest.fn();
    return {
        useUniformSizelists: jest.fn(() => ({
            sizelistList: [{ id: sizeListIds[0], name: "Test Size List" }, { id: sizeListIds[1], name: "Test Size List 2" }, { id: sizeListIds[2], name: "Test Size List 3" }],
        })),
        useUniformTypeList: jest.fn(() => ({
            mutate: typeListMutate,
        })),
    };
});
jest.mock("@/lib/locales/client", () => {
    return {
        useI18n: jest.fn(() => (key: string) => key),
    };
});
jest.mock("@/components/modals/modalProvider", () => {
    const dangerModal = jest.fn();
    return {
        useModal: jest.fn(() => ({
            dangerConfirmationModal: dangerModal,
        })),
    };
});
jest.mock("@/dal/uniform/generation/_index", () => {
    return {
        createUniformGeneration: jest.fn(async () => "uniform generation created"),
        deleteUniformGeneration: jest.fn(async () => "uniform generation deleted"),
        updateUniformGeneration: jest.fn(async () => "uniform generation updated"),
    };
});
jest.mock('@/lib/locales/client', () => {
    return ({
        useScopedI18n: jest.fn().mockImplementation((scope: string) => {
            return function (key: string, values?: any) {
                return `${scope}.${key}`;
            }
        }),
        useI18n: jest.fn().mockImplementation(() => jest.fn((key) => key)),
        useCurrentLocale: jest.fn(() => ({
            locale: "de",
            setLocale: jest.fn(),
        })),
    });
});
jest.mock("@/components/errorMessage", () => {
    return function ErrorMessage({ error, ariaLabel, ...divProps}: { error: string, testId: string, ariaLabel: string }) {
        return <div className="text-danger fs-7" role="alert" aria-label={ariaLabel} {...divProps}>{error}</div>;
    };
});

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

describe('<UniformgenerationOffcanvas>', () => {
    const { updateUniformGeneration, createUniformGeneration, deleteUniformGeneration } = require('@/dal/uniform/generation/_index');
    const { useUniformTypeList, useUniformSizelists } = require('@/dataFetcher/uniformAdmin');
    const { useModal } = require('@/components/modals/modalProvider');

    afterEach(() => jest.clearAllMocks());

    describe('with generation', () => {
        it('should render the component', async () => {
            render(
                <UniformgenerationOffcanvas
                    generation={testGeneration}
                    uniformTypeId={uniformTypeId}
                    usingSizes={true}
                    onHide={() => { }}
                />
            );

            const sizeSelect = screen.queryByText('common.uniform.sizelist.label');
            expect(sizeSelect).toBeInTheDocument();


            const nameInput = screen.getByRole('textbox', { name: 'common.name' });
            const sizeSelectDiv = screen.getByRole('paragraph', { name: 'common.uniform.sizelist.label' });
            const outdatedSwitch = screen.getByRole('switch', { name: 'common.uniform.generation.outdated' });

            expect(nameInput).toHaveValue(testGeneration.name);
            expect(sizeSelectDiv).toHaveTextContent(testGeneration.sizelist.name);
            expect(outdatedSwitch).toHaveAttribute('aria-checked', String(testGeneration.outdated));

            expect(screen.getByRole('dialog')).toMatchSnapshot();
        });
        it('hide sizelist if usingSizes is false', async () => {
            render(
                <UniformgenerationOffcanvas
                    generation={testGeneration}
                    uniformTypeId={uniformTypeId}
                    usingSizes={false}
                    onHide={() => { }}
                />
            );

            const sizeSelect = screen.queryByText('common.uniform.sizelist.label');
            expect(sizeSelect).not.toBeInTheDocument();
        });
        it('should mark sizelist-label if usingSizes but sizelist is null', async () => {
            render(
                <UniformgenerationOffcanvas
                    generation={{ ...testGeneration, fk_sizelist: null }}
                    uniformTypeId={uniformTypeId}
                    usingSizes={true}
                    onHide={() => { }}
                />
            );

            const sizeSelect = screen.queryByText('common.uniform.sizelist.label');
            expect(sizeSelect).toBeInTheDocument();
            expect(sizeSelect).toHaveClass('text-danger');
        });
        it('should set editable state', async () => {
            render(
                <UniformgenerationOffcanvas
                    generation={testGeneration}
                    uniformTypeId={uniformTypeId}
                    usingSizes={true}
                    onHide={() => { }}
                />
            );

            const editButton = screen.getByText('common.actions.edit');
            const deleteButton = screen.getByText('common.actions.delete');
            const nameInput = screen.getByRole('textbox', { name: 'common.name' });
            const sizeSelectDiv = screen.getByRole('paragraph', { name: 'common.uniform.sizelist.label' });
            const outdatedSwitch = screen.getByRole('switch', { name: 'common.uniform.generation.outdated' });

            let saveButton = screen.queryByText('common.actions.save');
            let cancelButton = screen.queryByText('common.actions.cancel');
            let sizeSelect = screen.queryByRole('combobox', { name: 'common.uniform.sizelist.label' });

            expect(nameInput).toBeVisible();
            expect(nameInput).toHaveClass('form-control-plaintext');
            expect(nameInput).toHaveAttribute('disabled');
            expect(outdatedSwitch).toBeVisible();
            expect(outdatedSwitch).toHaveAttribute('aria-disabled', 'true');
            expect(sizeSelect).toBeNull();
            expect(sizeSelectDiv).toBeVisible();


            expect(editButton).toBeVisible();
            expect(deleteButton).toBeVisible();
            expect(saveButton).toBeNull();
            expect(cancelButton).toBeNull();

            expect(editButton).not.toHaveAttribute('disabled');
            expect(deleteButton).not.toHaveAttribute('disabled');

            await user.click(editButton);
            saveButton = screen.queryByText('common.actions.save');
            cancelButton = screen.queryByText('common.actions.cancel');
            sizeSelect = screen.getByRole('combobox', { name: 'common.uniform.sizelist.label' });

            expect(nameInput).toHaveClass('form-control');
            expect(nameInput).not.toHaveAttribute('disabled');
            expect(outdatedSwitch).toHaveAttribute('aria-disabled', 'false');
            expect(sizeSelect).toBeVisible();
            expect(sizeSelect).not.toHaveAttribute('disabled');
            expect(sizeSelectDiv).not.toBeVisible();

            expect(editButton).toBeVisible();
            expect(deleteButton).toBeVisible();
            expect(saveButton).toBeVisible();
            expect(cancelButton).toBeVisible();
            expect(editButton).toHaveAttribute('disabled');
            expect(deleteButton).toHaveAttribute('disabled');
        });

        it('resets on cancel', async () => {
            render(
                <UniformgenerationOffcanvas
                    generation={testGeneration}
                    uniformTypeId={uniformTypeId}
                    usingSizes={true}
                    onHide={() => { }}
                />
            );

            const editButton = screen.getByText('common.actions.edit');
            await user.click(editButton);


            const nameInput = screen.getByRole('textbox', { name: 'common.name' });
            const outdatedSwitch = screen.getByRole('switch', { name: 'common.uniform.generation.outdated' });
            const sizeSelect = screen.getByRole('combobox', { name: 'common.uniform.sizelist.label' });
            const cancelButton = screen.getByText('common.actions.cancel');

            await user.clear(nameInput);
            await user.type(nameInput, 'New Name');
            await user.click(outdatedSwitch);
            await user.selectOptions(sizeSelect, sizeListIds[1]);
            expect(nameInput).toHaveValue('New Name');
            expect(outdatedSwitch).toHaveAttribute('aria-checked', 'true');
            expect(sizeSelect).toHaveValue(sizeListIds[1]);
            await user.click(cancelButton);

            expect(nameInput).toHaveValue(testGeneration.name);
            expect(outdatedSwitch).toHaveAttribute('aria-checked', String(testGeneration.outdated));
            expect(sizeSelect).not.toBeInTheDocument();
            const sizeSelectDiv = screen.getByRole('paragraph', { name: 'common.uniform.sizelist.label' });
            expect(sizeSelectDiv).toHaveTextContent(testGeneration.sizelist.name);
        });
    });
    describe('without generation', () => {
        it('should render in editable state if no generation is passed', async () => {
            render(
                <UniformgenerationOffcanvas
                    generation={null}
                    uniformTypeId={uniformTypeId}
                    usingSizes={true}
                    onHide={() => { }}
                />
            );

            expect(screen.getByRole('dialog')).toMatchSnapshot();
        });

        it('should hide on Cancel', async () => {
            const onHide = jest.fn();
            render(
                <UniformgenerationOffcanvas
                    generation={null}
                    uniformTypeId={uniformTypeId}
                    usingSizes={true}
                    onHide={onHide}
                />
            );

            const cancelButton = screen.getByText('common.actions.cancel');
            await user.click(cancelButton);
            expect(onHide).toHaveBeenCalledTimes(1);
            expect(onHide).toHaveBeenCalledWith();
        });
    });
    describe('dal methods', () => {
        it('should delete generation', async () => {
            deleteUniformGeneration.mockReturnValue('uniform generation deleted');
            const onHide = jest.fn();

            let dangerOption;
            const { dangerConfirmationModal } = useModal();
            dangerConfirmationModal.mockImplementation((option: any) => dangerOption = option.dangerOption);
            const { mutate } = useUniformTypeList();

            render(
                <UniformgenerationOffcanvas
                    generation={testGeneration}
                    uniformTypeId={uniformTypeId}
                    usingSizes={true}
                    onHide={onHide}
                />
            );

            const deleteButton = screen.getByText('common.actions.delete');
            await user.click(deleteButton);

            expect(dangerConfirmationModal).toHaveBeenCalled();
            expect(dangerConfirmationModal).toHaveBeenCalledWith({
                header: 'admin.uniform.generationList.deleteModal.header',
                message: expect.anything(),
                confirmationText: 'admin.uniform.generationList.deleteModal.confirmationText',
                dangerOption: {
                    option: 'common.actions.delete',
                    function: expect.any(Function),
                },
            });
            expect(dangerOption).toBeDefined();

            await dangerOption!.function();
            expect(deleteUniformGeneration).toHaveBeenCalledTimes(1);
            expect(deleteUniformGeneration).toHaveBeenCalledWith(testGeneration.id);
            expect(mutate).toHaveBeenCalledTimes(1);
            expect(mutate).toHaveBeenCalledWith("uniform generation deleted");
            expect(onHide).toHaveBeenCalledTimes(1);
        });
        it('should call save function', async () => {
            const onHide = jest.fn();
            const { mutate } = useUniformTypeList();

            render(
                <UniformgenerationOffcanvas
                    generation={testGeneration}
                    uniformTypeId={uniformTypeId}
                    usingSizes={true}
                    onHide={onHide}
                />
            );

            const editButton = screen.getByText('common.actions.edit');
            await user.click(editButton);

            const nameInput = screen.getByRole('textbox', { name: 'common.name' });
            const outdatedSwitch = screen.getByRole('switch', { name: 'common.uniform.generation.outdated' });
            const sizeSelect = screen.getByRole('combobox', { name: 'common.uniform.sizelist.label' });
            const saveButton = screen.getByText('common.actions.save');

            await user.clear(nameInput);
            await user.type(nameInput, 'New Name');
            await user.click(outdatedSwitch);
            await user.selectOptions(sizeSelect, sizeListIds[1]);

            expect(nameInput).toHaveValue('New Name');
            expect(outdatedSwitch).toHaveAttribute('aria-checked', 'true');
            expect(sizeSelect).toHaveValue(sizeListIds[1]);

            await user.click(saveButton);
            expect(updateUniformGeneration).toHaveBeenCalledTimes(1);
            expect(updateUniformGeneration).toHaveBeenCalledWith({
                data: {
                    name: 'New Name',
                    outdated: true,
                    fk_sizelist: sizeListIds[1],
                },
                id: testGeneration.id,
            });

            expect(mutate).toHaveBeenCalledTimes(1);
            expect(mutate).toHaveBeenCalledWith("uniform generation updated");
            expect(onHide).toHaveBeenCalledTimes(0);
        });
        it('should catch update form-errors', async () => {
            updateUniformGeneration.mockImplementationOnce(async () => {
                return {
                    error: {
                        message: "custom.uniform.generation.nameDuplication",
                        formElement: "name",
                    }
                };
            });

            render(
                <UniformgenerationOffcanvas
                    generation={testGeneration}
                    uniformTypeId={uniformTypeId}
                    usingSizes={true}
                    onHide={() => { }}
                />
            );

            const editButton = screen.getByText('common.actions.edit');
            await user.click(editButton);

            const nameInput = screen.getByRole('textbox', { name: 'common.name' });
            const saveButton = screen.getByText('common.actions.save');

            await user.clear(nameInput);
            await user.type(nameInput, 'New Name');
            await user.click(saveButton);

            expect(updateUniformGeneration).toHaveBeenCalledTimes(1);
            expect(updateUniformGeneration).toHaveBeenCalledWith({
                data: {
                    name: 'New Name',
                    outdated: false,
                    fk_sizelist: sizeListIds[0],
                },
                id: testGeneration.id,
            });

            const errorMessage = await screen.findByText('custom.uniform.generation.nameDuplication');
            expect(errorMessage).toBeInTheDocument();
        });
        it('should call create function', async () => {
            const onHide = jest.fn();
            const { mutate } = useUniformTypeList();

            render(
                <UniformgenerationOffcanvas
                    generation={null}
                    uniformTypeId={uniformTypeId}
                    usingSizes={true}
                    onHide={onHide}
                />
            );

            const nameInput = screen.getByRole('textbox', { name: 'common.name' });
            const outdatedSwitch = screen.getByRole('switch', { name: 'common.uniform.generation.outdated' });
            const sizeSelect = screen.getByRole('combobox', { name: 'common.uniform.sizelist.label' });
            const createButton = screen.getByText('common.actions.create');

            await user.type(nameInput, 'New Name');
            await user.click(outdatedSwitch);
            await user.selectOptions(sizeSelect, sizeListIds[1]);
            expect(nameInput).toHaveValue('New Name');
            expect(outdatedSwitch).toHaveAttribute('aria-checked', 'true');
            expect(sizeSelect).toHaveValue(sizeListIds[1]);
            await user.click(createButton);

            expect(createUniformGeneration).toHaveBeenCalledTimes(1);
            expect(createUniformGeneration).toHaveBeenCalledWith({
                name: 'New Name',
                outdated: true,
                fk_sizelist: sizeListIds[1],
                uniformTypeId: uniformTypeId,
            });

            expect(mutate).toHaveBeenCalledTimes(1);
            expect(mutate).toHaveBeenCalledWith("uniform generation created");
            onHide();
        });
        it('should catch create form-errors', async () => {
            createUniformGeneration.mockImplementationOnce(async () => {
                return {
                    error: {
                        message: "custom.uniform.generation.nameDuplication",
                        formElement: "name",
                    }
                };
            });

            render(
                <UniformgenerationOffcanvas
                    generation={null}
                    uniformTypeId={uniformTypeId}
                    usingSizes={true}
                    onHide={() => { }}
                />
            );

            const nameInput = screen.getByRole('textbox', { name: 'common.name' });
            const sizeSelect = screen.getByRole('combobox', { name: 'common.uniform.sizelist.label' });
            const createButton = screen.getByText('common.actions.create');

            await user.type(nameInput, 'New Name');
            await user.selectOptions(sizeSelect, sizeListIds[0]);
            await user.click(createButton);

            expect(createUniformGeneration).toHaveBeenCalledTimes(1);
            expect(createUniformGeneration).toHaveBeenCalledWith({
                name: 'New Name',
                outdated: false,
                fk_sizelist: sizeListIds[0],
                uniformTypeId: uniformTypeId,
            });

            const errorMessage = await screen.findByText('custom.uniform.generation.nameDuplication');
            expect(errorMessage).toBeInTheDocument();
        });
    });
    describe('form validation', () => {
        it('should show error if name is empty', async () => {
            render(
                <UniformgenerationOffcanvas
                    generation={testGeneration}
                    uniformTypeId={uniformTypeId}
                    usingSizes={true}
                    onHide={() => { }}
                />
            );

            const editButton = screen.getByText('common.actions.edit');
            await user.click(editButton);

            const nameInput = screen.getByRole('textbox', { name: 'common.name' });
            const saveButton = screen.getByText('common.actions.save');

            await user.clear(nameInput);
            await user.click(saveButton);

            expect(updateUniformGeneration).toHaveBeenCalledTimes(0);

            const errorMessage = await screen.findByRole('alert', { name: 'error message name' });
            expect(errorMessage).toBeVisible();
            expect(errorMessage).toHaveTextContent('string.required');
        });

        it('should show error if sizelist is empty and usingSizes', async () => {
            render(
                <UniformgenerationOffcanvas
                    generation={null}
                    uniformTypeId={uniformTypeId}
                    usingSizes={true}
                    onHide={() => { }}
                />
            );

            const nameInput = screen.getByRole('textbox', { name: 'common.name' });
            const createButton = screen.getByText('common.actions.create');
            await user.type(nameInput, 'New Name');
            await user.click(createButton);

            const sizelistError = screen.getByRole('alert', {name: 'error message fk_sizelist'});
            expect(sizelistError).toBeVisible();
            expect(sizelistError).toHaveTextContent('pleaseSelect');
        });
        it('should allow sizelist empty if not usingSizes', async () => {
            render(
                <UniformgenerationOffcanvas
                    generation={null}
                    uniformTypeId={uniformTypeId}
                    usingSizes={false}
                    onHide={() => { }}
                />
            );

            const nameInput = screen.getByRole('textbox', { name: 'common.name' });
            const createButton = screen.getByText('common.actions.create');
            await user.type(nameInput, 'New Name');
            await user.click(createButton);

            expect(createUniformGeneration).toHaveBeenCalledTimes(1);
        });
    });
});
