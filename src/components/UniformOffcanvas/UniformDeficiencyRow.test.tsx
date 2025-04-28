import { Deficiency } from "@/types/deficiencyTypes";
import { getByRole, getByText, queryByText, render, screen } from "@testing-library/react";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { UniformDeficiencyRow } from "./UniformDeficiencyRow";


const uniformId = '079379db-8510-4c9a-b549-15d80d29aca5';
const deficiencyTypeList = [
    {
        id: 'de3860d4-c88e-4a7c-be4c-7e832eda31d4',
        name: 'Test Type',
        dependent: 'uniform',
    },
    {
        id: '61d28738-4757-4e98-bfbf-a82f8404a74a',
        name: 'Another One',
        dependent: 'uniform',
    },
];
const deficiencies: Deficiency[] = [
    {
        id: '80c36a66-81e9-4c9c-8d56-a095a6e9e28b',
        comment: 'Test comment',
        description: 'Test description',
        dateCreated: new Date('2023-10-01T12:00:00Z'),
        dateUpdated: new Date('2023-10-01T12:00:00Z'),
        userCreated: 'user',
        userUpdated: 'user',
        typeId: deficiencyTypeList[0].id,
        typeName: deficiencyTypeList[0].name,
    },
    {
        id: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
        comment: 'Test comment 2',
        description: 'Test description 2',
        dateCreated: new Date('2023-10-02T12:00:00Z'),
        dateUpdated: new Date('2023-10-12T12:00:00Z'),
        userCreated: 'user',
        userUpdated: 'user1',
        typeId: deficiencyTypeList[1].id,
        typeName: deficiencyTypeList[1].name,
    },
    {
        id: 'b7c8d9e0-f1g2-h3i4-j5k6-l7m8n9o0p1q2',
        comment: 'Test comment 3',
        description: 'Test description 3',
        dateCreated: new Date('2023-10-03T12:00:00Z'),
        dateUpdated: new Date('2023-10-12T12:00:00Z'),
        dateResolved: new Date('2023-10-17T12:00:00Z'),
        userCreated: 'user',
        userUpdated: 'user1',
        userResolved: 'user2',
        typeId: deficiencyTypeList[0].id,
        typeName: deficiencyTypeList[0].name,
    },
]

jest.mock('@/dal/inspection/deficiency', () => {
    return {
        createUniformDeficiency: jest.fn(async () => "created successfully"),
        resolveDeficiency: jest.fn(async () => "resolved successfully"),
        updateUniformDeficiency: jest.fn(async () => "updated successfully"),
    }
});
jest.mock('@/dataFetcher/deficiency', () => {
    return {
        useDeficienciesByUniformId: jest.fn((_, includeResovled) => {
            if (includeResovled) {
                return { deficiencies };
            } else {
                return { deficiencies: deficiencies.filter(def => !def.dateResolved) };
            }
        }),
        useDeficiencyTypes: jest.fn(() => ({ deficiencyTypeList })),
    };
});

jest.mock("swr", () => {
    return {
        mutate: jest.fn(async () => { })
    }
});

describe('UniformDeficiencyRow', () => {

    const setEditable = async (card: HTMLElement, user: UserEvent) => {
        const actionMenu = getByRole(card, 'button', { name: 'Deficiency actions menu' });
        await user.click(actionMenu);
        const editButton = getByRole(card, 'button', { name: 'common.actions.edit' });
        await user.click(editButton);
    }

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        const { container } = render(
            <UniformDeficiencyRow
                uniformId={uniformId}
            />
        );
        expect(container).toMatchSnapshot();
    });

    it('only shows resolved deficiencies when includeResolved is true', async () => {
        const user = userEvent.setup();
        const { useDeficienciesByUniformId } = jest.requireMock('@/dataFetcher/deficiency');

        render(
            <UniformDeficiencyRow
                uniformId={uniformId}
            />
        );

        const showResolvedToggle = screen.getByRole('checkbox', { name: 'uniformOffcanvas.deficiency.includeResolved' });
        expect(showResolvedToggle).not.toBeChecked();
        expect(useDeficienciesByUniformId).toHaveBeenCalledTimes(1);
        expect(useDeficienciesByUniformId).toHaveBeenCalledWith(uniformId, false);
        expect(screen.getAllByRole('listitem')).toHaveLength(2);

        await user.click(showResolvedToggle);
        expect(showResolvedToggle).toBeChecked();
        expect(useDeficienciesByUniformId).toHaveBeenCalledTimes(2);
        expect(useDeficienciesByUniformId).toHaveBeenLastCalledWith(uniformId, true);
        expect(screen.getAllByRole('listitem')).toHaveLength(3);

        await user.click(showResolvedToggle);
        expect(showResolvedToggle).not.toBeChecked();
        expect(useDeficienciesByUniformId).toHaveBeenCalledTimes(3);
        expect(useDeficienciesByUniformId).toHaveBeenLastCalledWith(uniformId, false);
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    describe('expand/collapse', () => {
        it('should expand/collapse the card', async () => {
            const user = userEvent.setup();
            render(
                <UniformDeficiencyRow
                    uniformId={uniformId}
                />
            );

            const firstCard = screen.getByRole('listitem', { name: 'Deficiency 0' });
            expect(firstCard).toBeInTheDocument();

            const expandButton = getByRole(firstCard, 'button', { name: 'expandableArea.showMore' });
            await user.click(expandButton);
            

            const collapseButton = getByRole(firstCard, 'button', { name: 'collapse' });
            await user.click(collapseButton);
        });
    });

    describe('createDeficiencyCard', () => {
        it('should show createDeficiencyCard', async () => {
            const user = userEvent.setup();
            render(
                <UniformDeficiencyRow
                    uniformId={uniformId}
                />
            );

            await user.click(screen.getByRole('button', { name: 'common.actions.create' }));
            const createCard = screen.getByRole('listitem', { name: 'uniformOffcanvas.deficiency.createCardLabel' });

            const createButton = getByRole(createCard, 'button', { name: 'common.actions.create' });
            const cancelButton = getByRole(createCard, 'button', { name: 'common.actions.cancel' });
            const commentInput = getByRole(createCard, 'textbox', { name: 'uniformOffcanvas.deficiency.label.comment' });
            const typeSelect = getByRole(createCard, 'combobox', { name: 'uniformOffcanvas.deficiency.label.deficiencyType' });

            expect(createButton).toBeEnabled();
            expect(cancelButton).toBeEnabled();
            expect(commentInput).toHaveValue('');
            expect(typeSelect).toHaveValue(deficiencyTypeList[0].id);

            expect(typeSelect).toHaveTextContent(deficiencyTypeList[0].name);
            expect(getByRole(typeSelect, 'option', { name: deficiencyTypeList[0].name })).toBeInTheDocument();
            expect(getByRole(typeSelect, 'option', { name: deficiencyTypeList[1].name })).toBeInTheDocument();
        });

        it('should hide on cancel', async () => {
            const user = userEvent.setup();
            const { container } = render(
                <UniformDeficiencyRow
                    uniformId={uniformId}
                />
            );

            await user.click(getByRole(container, 'button', { name: 'common.actions.create' }));
            const createCard = getByRole(container, 'listitem', { name: 'uniformOffcanvas.deficiency.createCardLabel' });
            expect(createCard).toBeInTheDocument();

            const cancelButton = getByRole(createCard, 'button', { name: 'common.actions.cancel' });
            await user.click(cancelButton);
            expect(createCard).not.toBeInTheDocument();
        });

        it('should call createDeficiency on create', async () => {
            const user = userEvent.setup();
            const { createUniformDeficiency } = jest.requireMock('@/dal/inspection/deficiency');
            const { mutate } = jest.requireMock('swr');
            render(
                <UniformDeficiencyRow
                    uniformId={uniformId}
                />
            );

            await user.click(screen.getByRole('button', { name: 'common.actions.create' }));
            const createCard = screen.getByRole('listitem', { name: 'uniformOffcanvas.deficiency.createCardLabel' });
            const createButton = getByRole(createCard, 'button', { name: 'common.actions.create' });
            const commentInput = getByRole(createCard, 'textbox', { name: 'uniformOffcanvas.deficiency.label.comment' });
            const typeSelect = getByRole(createCard, 'combobox', { name: 'uniformOffcanvas.deficiency.label.deficiencyType' });

            await user.type(commentInput, 'Test comment');
            await user.selectOptions(typeSelect, deficiencyTypeList[1].id);
            expect(createButton).toBeEnabled();

            await user.click(createButton);
            expect(createUniformDeficiency).toHaveBeenCalledTimes(1);
            expect(createUniformDeficiency).toHaveBeenCalledWith({
                uniformId,
                data: {
                    comment: 'Test comment',
                    typeId: deficiencyTypeList[1].id
                }
            });
            expect(mutate).toHaveBeenCalledTimes(1);
            console.log(mutate.mock.calls[0][0]);
            expect(mutate.mock.calls[0][0](`uniform.${uniformId}.deficiencies.true`)).toBeTruthy();
            expect(mutate.mock.calls[0][0](`uniform.${uniformId}.deficiencies.false`)).toBeTruthy();
            expect(mutate.mock.calls[0][0](`uniform.${uniformId}.somethingElse`)).toBeFalsy();

            expect(screen.queryByRole('listitem', { name: 'uniformOffcanvas.deficiency.createCardLabel' })).not.toBeInTheDocument();
        });

        it('should catch exceptions on create', async () => {
            const user = userEvent.setup();
            const { createUniformDeficiency } = jest.requireMock('@/dal/inspection/deficiency');
            const { mutate } = jest.requireMock('swr');
            const { toast } = jest.requireMock('react-toastify');
            createUniformDeficiency.mockRejectedValueOnce(new Error('Test error'));

            render(
                <UniformDeficiencyRow
                    uniformId={uniformId}
                />
            );

            await user.click(screen.getByRole('button', { name: 'common.actions.create' }));
            const createCard = screen.getByRole('listitem', { name: 'uniformOffcanvas.deficiency.createCardLabel' });

            const createButton = getByRole(createCard, 'button', { name: 'common.actions.create' });
            const commentInput = getByRole(createCard, 'textbox', { name: 'uniformOffcanvas.deficiency.label.comment' });
            const typeSelect = getByRole(createCard, 'combobox', { name: 'uniformOffcanvas.deficiency.label.deficiencyType' });

            await user.type(commentInput, 'Test comment');
            await user.selectOptions(typeSelect, deficiencyTypeList[1].id);
            await user.click(createButton);

            expect(createUniformDeficiency).toHaveBeenCalledTimes(1);
            expect(mutate).toHaveBeenCalledTimes(0);
            expect(toast.error).toHaveBeenCalledTimes(1);
        });
    });

    describe('update Deficiency', () => {
        it('sets card to edit mode', async () => {
            const user = userEvent.setup();
            render(
                <UniformDeficiencyRow
                    uniformId={uniformId}
                />
            );
            // Set the card to edit mode
            const firstCard = screen.getByRole('listitem', { name: 'Deficiency 0' });
            await setEditable(firstCard, user);

            // get elements
            const saveButton = getByRole(firstCard, 'button', { name: 'common.actions.save' });
            const cancelButton = getByRole(firstCard, 'button', { name: 'common.actions.cancel' });
            const commentInput = getByRole(firstCard, 'textbox', { name: 'uniformOffcanvas.deficiency.label.comment' });
            const typeSelect = getByRole(firstCard, 'combobox', { name: 'uniformOffcanvas.deficiency.label.deficiencyType' });

            // check that the card is in edit mode
            expect(saveButton).toBeEnabled();
            expect(cancelButton).toBeEnabled();
            expect(commentInput).toHaveValue(deficiencies[0].comment);
            expect(typeSelect).toHaveValue(deficiencies[0].typeId);

            // validate typeSelect options
            expect(typeSelect).toHaveTextContent(deficiencyTypeList[0].name);
            expect(getByRole(typeSelect, 'option', { name: deficiencyTypeList[0].name })).toBeInTheDocument();
            expect(getByRole(typeSelect, 'option', { name: deficiencyTypeList[1].name })).toBeInTheDocument();
        });

        it('resets data on cancel', async () => {
            const user = userEvent.setup();
            render(
                <UniformDeficiencyRow
                    uniformId={uniformId}
                />
            );

            // Set the card to edit mode
            const firstCard = screen.getByRole('listitem', { name: 'Deficiency 0' });
            await setEditable(firstCard, user);

            // change form data
            const commentInput = getByRole(firstCard, 'textbox', { name: 'uniformOffcanvas.deficiency.label.comment' });
            const typeSelect = getByRole(firstCard, 'combobox', { name: 'uniformOffcanvas.deficiency.label.deficiencyType' });
            await user.clear(commentInput);
            await user.type(commentInput, 'Something creative');
            await user.selectOptions(typeSelect, deficiencyTypeList[1].id);

            // cancel the edit
            const cancelButton = getByRole(firstCard, 'button', { name: 'common.actions.cancel' });
            await user.click(cancelButton);

            // check that the card is not in edit mode
            expect(typeSelect).not.toBeInTheDocument();
            expect(commentInput).not.toBeInTheDocument();

            // check that the data is reset
            expect(getByText(firstCard, deficiencies[0].comment)).toBeInTheDocument();
            expect(getByText(firstCard, deficiencies[0].typeName)).toBeInTheDocument();
            expect(queryByText(firstCard, 'Something creative')).toBeNull();
            expect(queryByText(firstCard, deficiencyTypeList[1].name)).toBeNull();

            // check that formValues are reset when editing again
            await setEditable(firstCard, user);
            expect(commentInput).toHaveValue(deficiencies[0].comment);
            expect(typeSelect).toHaveValue(deficiencies[0].typeId);
        });
        it('should call updateDeficiency on save', async () => {
            const user = userEvent.setup();
            const { updateUniformDeficiency } = jest.requireMock('@/dal/inspection/deficiency');
            const { mutate } = jest.requireMock('swr');
            render(
                <UniformDeficiencyRow
                    uniformId={uniformId}
                />
            );

            // Set the card to edit mode
            const firstCard = screen.getByRole('listitem', { name: 'Deficiency 0' });
            await setEditable(firstCard, user);

            // change form data
            const commentInput = getByRole(firstCard, 'textbox', { name: 'uniformOffcanvas.deficiency.label.comment' });
            const typeSelect = getByRole(firstCard, 'combobox', { name: 'uniformOffcanvas.deficiency.label.deficiencyType' });
            await user.clear(commentInput);
            await user.type(commentInput, 'Something creative');
            await user.selectOptions(typeSelect, deficiencyTypeList[1].id);

            // save the edit
            const saveButton = getByRole(firstCard, 'button', { name: 'common.actions.save' });
            await user.click(saveButton);

            // validate function calls
            expect(updateUniformDeficiency).toHaveBeenCalledTimes(1);
            expect(updateUniformDeficiency).toHaveBeenCalledWith({
                id: deficiencies[0].id,
                data: {
                    comment: 'Something creative',
                    typeId: deficiencyTypeList[1].id
                }
            });
            expect(mutate).toHaveBeenCalledTimes(1);
            expect(mutate.mock.calls[0][0](`uniform.${uniformId}.deficiencies.true`)).toBeTruthy();
            expect(mutate.mock.calls[0][0](`uniform.${uniformId}.deficiencies.false`)).toBeTruthy();
            expect(mutate.mock.calls[0][0](`uniform.${uniformId}.somethingElse`)).toBeFalsy();

            // check that the card is not in edit mode
            expect(commentInput).not.toBeInTheDocument();
            expect(typeSelect).not.toBeInTheDocument();
        });
        it('should catch exceptions on update', async () => {
            const user = userEvent.setup();
            const { updateUniformDeficiency } = jest.requireMock('@/dal/inspection/deficiency');
            const { mutate } = jest.requireMock('swr');
            const { toast } = jest.requireMock('react-toastify');
            updateUniformDeficiency.mockRejectedValueOnce(new Error('Test error'));

            render(
                <UniformDeficiencyRow
                    uniformId={uniformId}
                />
            );

            // Set the card to edit mode
            const firstCard = screen.getByRole('listitem', { name: 'Deficiency 0' });
            await setEditable(firstCard, user);

            // save the edit
            const saveButton = getByRole(firstCard, 'button', { name: 'common.actions.save' });
            await user.click(saveButton);

            // validate function calls
            expect(updateUniformDeficiency).toHaveBeenCalledTimes(1);
            expect(mutate).toHaveBeenCalledTimes(0);
            expect(toast.error).toHaveBeenCalledTimes(1);

            // check that the card is still in edit mode
            expect(getByRole(firstCard, 'textbox', { name: 'uniformOffcanvas.deficiency.label.comment' })).toBeInTheDocument();
            expect(getByRole(firstCard, 'combobox', { name: 'uniformOffcanvas.deficiency.label.deficiencyType' })).toBeInTheDocument();
            expect(getByRole(firstCard, 'button', { name: 'common.actions.save' })).toBeInTheDocument();
        });
    });
    describe('resolve Deficiency', () => {
        it('calls resolveDeficiency', async () => {
            const user = userEvent.setup();
            const { resolveDeficiency } = jest.requireMock('@/dal/inspection/deficiency');
            const { mutate } = jest.requireMock('swr');
            render(
                <UniformDeficiencyRow
                    uniformId={uniformId}
                />
            );

            // resolve the deficiency
            const firstCard = screen.getByRole('listitem', { name: 'Deficiency 0' });
            const actionMenu = getByRole(firstCard, 'button', { name: 'Deficiency actions menu' });
            await user.click(actionMenu);
            const resolveButton = getByRole(firstCard, 'button', { name: 'common.actions.resolve' });
            await user.click(resolveButton);

            // validate function calls
            expect(resolveDeficiency).toHaveBeenCalledTimes(1);
            expect(resolveDeficiency).toHaveBeenCalledWith(deficiencies[0].id);
            expect(mutate).toHaveBeenCalledTimes(1);
            expect(mutate.mock.calls[0][0](`uniform.${uniformId}.deficiencies.true`)).toBeTruthy();
            expect(mutate.mock.calls[0][0](`uniform.${uniformId}.deficiencies.false`)).toBeTruthy();
            expect(mutate.mock.calls[0][0](`uniform.${uniformId}.somethingElse`)).toBeFalsy();
        });
        it('should catch exceptions on resolve', async () => {
            const user = userEvent.setup();
            const { resolveDeficiency } = jest.requireMock('@/dal/inspection/deficiency');
            const { mutate } = jest.requireMock('swr');
            const { toast } = jest.requireMock('react-toastify');
            resolveDeficiency.mockRejectedValueOnce(new Error('Test error'));

            render(
                <UniformDeficiencyRow
                    uniformId={uniformId}
                />
            );

            // resolve the deficiency
            const firstCard = screen.getByRole('listitem', { name: 'Deficiency 0' });
            const actionMenu = getByRole(firstCard, 'button', { name: 'Deficiency actions menu' });
            await user.click(actionMenu);
            const resolveButton = getByRole(firstCard, 'button', { name: 'common.actions.resolve' });
            await user.click(resolveButton);

            // validate error handling
            expect(resolveDeficiency).toHaveBeenCalledTimes(1);
            expect(mutate).toHaveBeenCalledTimes(0);
            expect(toast.error).toHaveBeenCalledTimes(1);
        });
    });
});