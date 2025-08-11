import "./UniformOffcanvasJestHelper";

import { getByLabelText, getByRole, getByText, queryByRole, queryByText, render, screen } from "@testing-library/react";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { UniformDeficiencyRow } from "./UniformDeficiencyRow";
import { mockDeficiencyList, mockDeficiencyTypeList, mockUniform } from "./UniformOffcanvasJestHelper";

describe('UniformDeficiencyRow', () => {
    const setEditable = async (card: HTMLElement, user: UserEvent) => {
        const actionMenu = getByRole(card, 'button', { name: /deficiency.label.actions/i });
        await user.click(actionMenu);
        const editButton = getByRole(card, 'button', { name: /edit/i });
        await user.click(editButton);
    }

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        const { container } = render(
            <UniformDeficiencyRow
                uniformId={mockUniform.id}
            />
        );
        expect(container).toMatchSnapshot();
    });

    it('only shows resolved deficiencies when includeResolved is true', async () => {
        const user = userEvent.setup();
        const { useDeficienciesByUniformId } = jest.requireMock('@/dataFetcher/deficiency');

        render(
            <UniformDeficiencyRow
                uniformId={mockUniform.id}
            />
        );

        const showResolvedToggle = screen.getByRole('checkbox', { name: /includeResolved/i });
        expect(showResolvedToggle).not.toBeChecked();
        expect(useDeficienciesByUniformId).toHaveBeenCalledTimes(1);
        expect(useDeficienciesByUniformId).toHaveBeenCalledWith(mockUniform.id, false);
        expect(screen.getAllByRole('listitem')).toHaveLength(2);

        await user.click(showResolvedToggle);
        expect(showResolvedToggle).toBeChecked();
        expect(useDeficienciesByUniformId).toHaveBeenCalledTimes(2);
        expect(useDeficienciesByUniformId).toHaveBeenLastCalledWith(mockUniform.id, true);
        expect(screen.getAllByRole('listitem')).toHaveLength(3);

        await user.click(showResolvedToggle);
        expect(showResolvedToggle).not.toBeChecked();
        expect(useDeficienciesByUniformId).toHaveBeenCalledTimes(3);
        expect(useDeficienciesByUniformId).toHaveBeenLastCalledWith(mockUniform.id, false);
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    it('shows empty state when no deficiencies', () => {
        const { useDeficienciesByUniformId } = jest.requireMock('@/dataFetcher/deficiency');
        useDeficienciesByUniformId.mockReturnValueOnce({ deficiencies: [] });

        render(
            <UniformDeficiencyRow
                uniformId={mockUniform.id}
            />
        );

        expect(screen.getByText(/noDeficiencies/i)).toBeInTheDocument();
    });

    it('doesnt show actionMenu when resolved', async () => {
        const user = userEvent.setup();
        render(
            <UniformDeficiencyRow
                uniformId={mockUniform.id}
            />
        );

        const showResolvedToggle = screen.getByRole('checkbox', { name: /includeResolved/i });
        await user.click(showResolvedToggle);

        const card = screen.getAllByRole('listitem')[2];
        expect(card).toBeInTheDocument();
        const actionMenu = queryByRole(card, 'button', { name: /deficiency.label.actions/i });
        expect(actionMenu).toBeNull();
    });

    describe('expand/collapse', () => {
        it('should expand/collapse the card - unresolved', async () => {
            const user = userEvent.setup();
            render(
                <UniformDeficiencyRow
                    uniformId={mockUniform.id}
                />
            );

            const card = screen.getAllByRole('listitem')[1];
            expect(card).toBeInTheDocument();

            const expandButton = getByRole(card, 'button', { name: /expandableArea.showMore/i });
            await user.click(expandButton);

            expect(getByText(card, /label.date.created/i)).toBeInTheDocument();
            expect(getByText(card, /label.date.updated/i)).toBeInTheDocument();
            expect(queryByText(card, /label.date.deleted/i)).toBeNull();
            expect(getByText(card, /label.user.created/i)).toBeInTheDocument();
            expect(getByText(card, /label.user.updated/i)).toBeInTheDocument();
            expect(queryByText(card, /label.user.deleted/i)).toBeNull();

            const dateCreated = getByLabelText(card, /label.date.created/i);
            const dateUpdated = getByLabelText(card, /label.date.updated/i);
            const userCreated = getByLabelText(card, /label.user.created/i);
            const userUpdated = getByLabelText(card, /label.user.updated/i);

            expect(dateCreated).toHaveTextContent('02.10.2023');
            expect(dateUpdated).toHaveTextContent('12.10.2023');
            expect(userCreated).toHaveTextContent('user');
            expect(userUpdated).toHaveTextContent('user1');

            const collapseButton = getByRole(card, 'button', { name: /showLess/i });
            await user.click(collapseButton);

            expect(queryByText(card, /label.date.created/i)).toBeNull();
            expect(queryByText(card, /label.date.updated/i)).toBeNull();
            expect(queryByText(card, /label.user.created/i)).toBeNull();
            expect(queryByText(card, /label.user.updated/i)).toBeNull();
        });

        it('should expand/collapse the card - resolved', async () => {
            const user = userEvent.setup();
            render(
                <UniformDeficiencyRow
                    uniformId={mockUniform.id}
                />
            );
            const showResolvedToggle = screen.getByRole('checkbox', { name: /includeResolved/i });
            await user.click(showResolvedToggle);
            expect(showResolvedToggle).toBeChecked();

            const card = screen.getAllByRole('listitem')[2];
            expect(card).toBeInTheDocument();

            const expandButton = getByRole(card, 'button', { name: /expandableArea.showMore/i });
            await user.click(expandButton);

            expect(getByText(card, /label.date.created/i)).toBeInTheDocument();
            expect(getByText(card, /label.date.updated/i)).toBeInTheDocument();
            expect(getByText(card, /label.date.resolved/i)).toBeInTheDocument();
            expect(getByText(card, /label.user.created/i)).toBeInTheDocument();
            expect(getByText(card, /label.user.updated/i)).toBeInTheDocument();
            expect(getByText(card, /label.user.resolved/i)).toBeInTheDocument();

            const dateCreated = getByLabelText(card, /label.date.created/i);
            const dateUpdated = getByLabelText(card, /label.date.updated/i);
            const dateDeleted = getByLabelText(card, /label.date.resolved/i);
            const userCreated = getByLabelText(card, /label.user.created/i);
            const userUpdated = getByLabelText(card, /label.user.updated/i);
            const userDeleted = getByLabelText(card, /label.user.resolved/i);

            expect(dateCreated).toHaveTextContent('03.10.2023');
            expect(dateUpdated).toHaveTextContent('12.10.2023');
            expect(dateDeleted).toHaveTextContent('17.10.2023');
            expect(userCreated).toHaveTextContent('user');
            expect(userUpdated).toHaveTextContent('user1');
            expect(userDeleted).toHaveTextContent('user2');

            const collapseButton = getByRole(card, 'button', { name: /showLess/i });
            await user.click(collapseButton);

            expect(queryByText(card, /label.date.created/i)).toBeNull();
            expect(queryByText(card, /label.date.updated/i)).toBeNull();
            expect(queryByText(card, /label.date.resolved/i)).toBeNull();
            expect(queryByText(card, /label.user.created/i)).toBeNull();
            expect(queryByText(card, /label.user.updated/i)).toBeNull();
            expect(queryByText(card, /label.user.resolved/i)).toBeNull();
        });
    });

    describe('createDeficiencyCard', () => {
        it('should show createDeficiencyCard', async () => {
            const user = userEvent.setup();
            render(
                <UniformDeficiencyRow
                    uniformId={mockUniform.id}
                />
            );

            await user.click(screen.getByRole('button', { name: /create/i }));
            const createCard = screen.getByRole('listitem', { name: /createCardLabel/i });

            const createButton = getByRole(createCard, 'button', { name: /create/i });
            const cancelButton = getByRole(createCard, 'button', { name: /cancel/i });
            const commentInput = getByRole(createCard, 'textbox', { name: /comment/i });
            const typeSelect = getByRole(createCard, 'combobox', { name: /deficiencyType/i });

            expect(createButton).toBeEnabled();
            expect(cancelButton).toBeEnabled();
            expect(commentInput).toHaveValue('');
            expect(typeSelect).toHaveValue(mockDeficiencyTypeList[0].id);

            expect(typeSelect).toHaveTextContent(mockDeficiencyTypeList[0].name);
            expect(getByRole(typeSelect, 'option', { name: mockDeficiencyTypeList[0].name })).toBeInTheDocument();
            expect(getByRole(typeSelect, 'option', { name: mockDeficiencyTypeList[1].name })).toBeInTheDocument();
        });

        it('should hide on cancel', async () => {
            const user = userEvent.setup();
            const { container } = render(
                <UniformDeficiencyRow
                    uniformId={mockUniform.id}
                />
            );

            await user.click(getByRole(container, 'button', { name: /create/i }));
            const createCard = getByRole(container, 'listitem', { name: /createCardLabel/i });
            expect(createCard).toBeInTheDocument();

            const cancelButton = getByRole(createCard, 'button', { name: /cancel/i });
            await user.click(cancelButton);
            expect(createCard).not.toBeInTheDocument();
        });

        it('should call createDeficiency on create', async () => {
            const user = userEvent.setup();
            const { createUniformDeficiency } = jest.requireMock('@/dal/inspection/deficiency');
            const { mutate } = jest.requireMock('swr');
            render(
                <UniformDeficiencyRow
                    uniformId={mockUniform.id}
                />
            );

            await user.click(screen.getByRole('button', { name: /create/i }));
            const createCard = screen.getByRole('listitem', { name: /createCardLabel/i });
            const createButton = getByRole(createCard, 'button', { name: /create/i });
            const commentInput = getByRole(createCard, 'textbox', { name: /comment/i });
            const typeSelect = getByRole(createCard, 'combobox', { name: /deficiencyType/i });

            await user.type(commentInput, 'Test comment');
            await user.selectOptions(typeSelect, mockDeficiencyTypeList[1].id);
            expect(createButton).toBeEnabled();

            await user.click(createButton);
            expect(createUniformDeficiency).toHaveBeenCalledTimes(1);
            expect(createUniformDeficiency).toHaveBeenCalledWith({
                uniformId: mockUniform.id,
                data: {
                    comment: 'Test comment',
                    typeId: mockDeficiencyTypeList[1].id
                }
            });
            expect(mutate).toHaveBeenCalledTimes(1);
            expect(mutate.mock.calls[0][0](`uniform.${mockUniform.id}.deficiencies.true`)).toBeTruthy();
            expect(mutate.mock.calls[0][0](`uniform.${mockUniform.id}.deficiencies.false`)).toBeTruthy();
            expect(mutate.mock.calls[0][0](`uniform.${mockUniform.id}.somethingElse`)).toBeFalsy();

            expect(screen.queryByRole('listitem', { name: /createCardLabel/i })).not.toBeInTheDocument();
        });

        it('should catch exceptions on create', async () => {
            const user = userEvent.setup();
            const { createUniformDeficiency } = jest.requireMock('@/dal/inspection/deficiency');
            const { mutate } = jest.requireMock('swr');
            const { toast } = jest.requireMock('react-toastify');
            createUniformDeficiency.mockRejectedValueOnce(new Error('Test error'));

            render(
                <UniformDeficiencyRow
                    uniformId={mockUniform.id}
                />
            );

            await user.click(screen.getByRole('button', { name: /create/i }));
            const createCard = screen.getByRole('listitem', { name: /createCardLabel/i });

            const createButton = getByRole(createCard, 'button', { name: /create/i });
            const commentInput = getByRole(createCard, 'textbox', { name: /comment/i });
            const typeSelect = getByRole(createCard, 'combobox', { name: /deficiencyType/i });

            await user.type(commentInput, 'Test comment');
            await user.selectOptions(typeSelect, mockDeficiencyTypeList[1].id);
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
                    uniformId={mockUniform.id}
                />
            );
            // Set the card to edit mode
            const firstCard = screen.getAllByRole('listitem')[0];
            await setEditable(firstCard, user);

            // get elements
            const saveButton = getByRole(firstCard, 'button', { name: /save/i });
            const cancelButton = getByRole(firstCard, 'button', { name: /cancel/i });
            const commentInput = getByRole(firstCard, 'textbox', { name: /comment/i });
            const typeSelect = getByRole(firstCard, 'combobox', { name: /deficiencyType/i });

            // check that the card is in edit mode
            expect(saveButton).toBeEnabled();
            expect(cancelButton).toBeEnabled();
            expect(commentInput).toHaveValue(mockDeficiencyList[0].comment);
            expect(typeSelect).toHaveValue(mockDeficiencyList[0].typeId);

            // validate typeSelect options
            expect(typeSelect).toHaveTextContent(mockDeficiencyTypeList[0].name);
            expect(getByRole(typeSelect, 'option', { name: mockDeficiencyTypeList[0].name })).toBeInTheDocument();
            expect(getByRole(typeSelect, 'option', { name: mockDeficiencyTypeList[1].name })).toBeInTheDocument();
        });

        it('resets data on cancel', async () => {
            const user = userEvent.setup();
            render(
                <UniformDeficiencyRow
                    uniformId={mockUniform.id}
                />
            );

            // Set the card to edit mode
            const firstCard = screen.getAllByRole('listitem')[0];
            await setEditable(firstCard, user);

            // change form data
            const commentInput = getByRole(firstCard, 'textbox', { name: /comment/i });
            const typeSelect = getByRole(firstCard, 'combobox', { name: /deficiencyType/i });
            await user.clear(commentInput);
            await user.type(commentInput, 'Something creative');
            await user.selectOptions(typeSelect, mockDeficiencyTypeList[1].id);

            // cancel the edit
            const cancelButton = getByRole(firstCard, 'button', { name: /cancel/i });
            await user.click(cancelButton);

            // check that the card is not in edit mode
            expect(typeSelect).not.toBeInTheDocument();
            expect(commentInput).not.toBeInTheDocument();

            // check that the data is reset
            expect(getByText(firstCard, mockDeficiencyList[0].comment)).toBeInTheDocument();
            expect(getByText(firstCard, mockDeficiencyList[0].typeName)).toBeInTheDocument();
            expect(queryByText(firstCard, 'Something creative')).toBeNull();
            expect(queryByText(firstCard, mockDeficiencyTypeList[1].name)).toBeNull();

            // check that formValues are reset when editing again
            await setEditable(firstCard, user);
            expect(getByRole(firstCard, 'textbox', { name: /comment/i })).toHaveValue(mockDeficiencyList[0].comment);
            expect(getByRole(firstCard, 'combobox', { name: /deficiencyType/i })).toHaveValue(mockDeficiencyList[0].typeId);
        });
        it('should call updateDeficiency on save', async () => {
            const user = userEvent.setup();
            const { updateUniformDeficiency } = jest.requireMock('@/dal/inspection/deficiency');
            const { mutate } = jest.requireMock('swr');
            render(
                <UniformDeficiencyRow
                    uniformId={mockUniform.id}
                />
            );

            // Set the card to edit mode
            const firstCard = screen.getAllByRole('listitem')[0];
            await setEditable(firstCard, user);

            // change form data
            const commentInput = getByRole(firstCard, 'textbox', { name: /comment/i });
            const typeSelect = getByRole(firstCard, 'combobox', { name: /deficiencyType/i });
            await user.clear(commentInput);
            await user.type(commentInput, 'Something creative');
            await user.selectOptions(typeSelect, mockDeficiencyTypeList[1].id);

            // save the edit
            const saveButton = getByRole(firstCard, 'button', { name: /save/i });
            await user.click(saveButton);

            // validate function calls
            expect(updateUniformDeficiency).toHaveBeenCalledTimes(1);
            expect(updateUniformDeficiency).toHaveBeenCalledWith({
                id: mockDeficiencyList[0].id,
                data: {
                    comment: 'Something creative',
                    typeId: mockDeficiencyTypeList[1].id
                }
            });
            expect(mutate).toHaveBeenCalledTimes(1);
            expect(mutate.mock.calls[0][0](`uniform.${mockUniform.id}.deficiencies.true`)).toBeTruthy();
            expect(mutate.mock.calls[0][0](`uniform.${mockUniform.id}.deficiencies.false`)).toBeTruthy();
            expect(mutate.mock.calls[0][0](`uniform.${mockUniform.id}.somethingElse`)).toBeFalsy();

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
                    uniformId={mockUniform.id}
                />
            );

            // Set the card to edit mode
            const firstCard = screen.getAllByRole('listitem')[0];
            await setEditable(firstCard, user);

            // save the edit
            const saveButton = getByRole(firstCard, 'button', { name: /save/i });
            await user.click(saveButton);

            // validate function calls
            expect(updateUniformDeficiency).toHaveBeenCalledTimes(1);
            expect(mutate).toHaveBeenCalledTimes(0);
            expect(toast.error).toHaveBeenCalledTimes(1);

            // check that the card is still in edit mode
            expect(getByRole(firstCard, 'textbox', { name: /comment/i })).toBeInTheDocument();
            expect(getByRole(firstCard, 'combobox', { name: /deficiencyType/i })).toBeInTheDocument();
            expect(getByRole(firstCard, 'button', { name: /save/i })).toBeInTheDocument();
        });
    });
    describe('resolve Deficiency', () => {
        it('calls resolveDeficiency', async () => {
            const user = userEvent.setup();
            const { resolveDeficiency } = jest.requireMock('@/dal/inspection/deficiency');
            const { mutate } = jest.requireMock('swr');
            render(
                <UniformDeficiencyRow
                    uniformId={mockUniform.id}
                />
            );

            // resolve the deficiency
            const firstCard = screen.getAllByRole('listitem')[0];
            const actionMenu = getByRole(firstCard, 'button', { name: /deficiency.label.actions/i });
            await user.click(actionMenu);
            const resolveButton = getByRole(firstCard, 'button', { name: /resolve/i });
            await user.click(resolveButton);

            // validate function calls
            expect(resolveDeficiency).toHaveBeenCalledTimes(1);
            expect(resolveDeficiency).toHaveBeenCalledWith(mockDeficiencyList[0].id);
            expect(mutate).toHaveBeenCalledTimes(1);
            expect(mutate.mock.calls[0][0](`uniform.${mockUniform.id}.deficiencies.true`)).toBeTruthy();
            expect(mutate.mock.calls[0][0](`uniform.${mockUniform.id}.deficiencies.false`)).toBeTruthy();
            expect(mutate.mock.calls[0][0](`uniform.${mockUniform.id}.somethingElse`)).toBeFalsy();
        });
        it('should catch exceptions on resolve', async () => {
            const user = userEvent.setup();
            const { resolveDeficiency } = jest.requireMock('@/dal/inspection/deficiency');
            const { mutate } = jest.requireMock('swr');
            const { toast } = jest.requireMock('react-toastify');
            resolveDeficiency.mockRejectedValueOnce(new Error('Test error'));

            render(
                <UniformDeficiencyRow
                    uniformId={mockUniform.id}
                />
            );

            // resolve the deficiency
            const firstCard = screen.getAllByRole('listitem')[0];
            const actionMenu = getByRole(firstCard, 'button', { name: /deficiency.label.actions/i });
            await user.click(actionMenu);
            const resolveButton = getByRole(firstCard, 'button', { name: /resolve/i });
            await user.click(resolveButton);

            // validate error handling
            expect(resolveDeficiency).toHaveBeenCalledTimes(1);
            expect(mutate).toHaveBeenCalledTimes(0);
            expect(toast.error).toHaveBeenCalledTimes(1);
        });
    });
});