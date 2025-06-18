import { render, screen } from "@testing-library/react";
import { InlineEditInputFormField } from "./InlineEditInputFormField";
import userEvent from "@testing-library/user-event";

describe('InlineEditInputFormField', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    it('renders default non-editable state', () => {
        render(
            <InlineEditInputFormField
                value="Test Value"
                onValueChange={jest.fn()}
                label="Test Label"
                name="testName"
            />
        );

        expect(screen.getByRole('paragraph')).toHaveTextContent('Test Value');
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });

    it('enters editable state on edit button click', async () => {
        const user = userEvent.setup();
        render(
            <InlineEditInputFormField
                value="Test Value"
                onValueChange={jest.fn()}
                label="Test Label"
                name="testName"
            />
        );

        const editButton = screen.getByRole('button', { name: /edit/i });
        await user.click(editButton);

        expect(screen.getByRole('textbox', { name: "Test Label" })).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toHaveValue('Test Value');
        expect(screen.getByRole('textbox')).toHaveAttribute('name', 'testName');
        expect(screen.getByRole('textbox')).toBeEnabled();

        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });


    it('resets value on cancel', async () => {
        const user = userEvent.setup();
        render(
            <InlineEditInputFormField
                value="Test Value"
                onValueChange={jest.fn()}
                label="Test Label"
                name="testName"
            />
        );

        await user.click(screen.getByRole('button', { name: /edit/i }));

        const inputField = screen.getByRole('textbox');
        await user.clear(inputField);
        await user.type(inputField, 'New Value');

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        expect(screen.getByRole('paragraph')).toHaveTextContent('Test Value');
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /edit/i }));
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toHaveValue('Test Value');
    });

    it('calls onValueChange on input change', async () => {
        const onValueChangeMock = jest.fn();
        const user = userEvent.setup();
        render(
            <InlineEditInputFormField
                value="Test Value"
                onValueChange={onValueChangeMock}
                label="Test Label"
                name="testName"
            />
        );

        const editButton = screen.getByRole('button', { name: /edit/i });
        await user.click(editButton);

        const inputField = screen.getByRole('textbox');
        await user.clear(inputField);
        expect(onValueChangeMock).toHaveBeenLastCalledWith("", expect.objectContaining({
            target: inputField,
            type: 'change'
        }));
        await user.type(inputField, 'Up');
        expect(onValueChangeMock).toHaveBeenLastCalledWith('Up', expect.objectContaining({
            target: inputField,
            type: 'change'
        }));
        await user.type(inputField, 'dated Value');
        expect(onValueChangeMock).toHaveBeenLastCalledWith('Updated Value', expect.objectContaining({
            target: inputField,
            type: 'change'
        }));
    });

    it('calls onSave on save button click', async () => {
        const onSaveMock = jest.fn();
        const user = userEvent.setup();
        const { rerender } = render(
            <InlineEditInputFormField
                value="Test Value"
                onValueChange={jest.fn()}
                onSave={onSaveMock}
                label="Test Label"
                name="testName"
            />
        );

        const editButton = screen.getByRole('button', { name: /edit/i });
        await user.click(editButton);

        const inputField = screen.getByRole('textbox');
        await user.clear(inputField);
        await user.type(inputField, 'Updated Value');

        const saveButton = screen.getByRole('button', { name: /save/i });
        await user.click(saveButton);

        expect(onSaveMock).toHaveBeenCalledWith('Updated Value');
        expect(screen.getByRole('paragraph')).toHaveTextContent('Test Value');

        rerender(
            <InlineEditInputFormField
                value="Updated Value"
                onValueChange={jest.fn()}
                onSave={onSaveMock}
                label="Test Label"
                name="testName"
            />
        );
        expect(screen.getByRole('paragraph')).toHaveTextContent('Updated Value');
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('calls onSave when pressing Enter', async () => {
        const onSaveMock = jest.fn();
        const user = userEvent.setup();
        render(
            <InlineEditInputFormField
                value="Test Value"
                onValueChange={jest.fn()}
                onSave={onSaveMock}
                label="Test Label"
                name="testName"
            />
        );

        await user.click(screen.getByRole('button', { name: /edit/i }));

        const inputField = screen.getByRole('textbox');
        await user.clear(inputField);
        await user.type(inputField, 'Updated Value');
        expect(onSaveMock).not.toHaveBeenCalled();
        await user.keyboard('{Enter}');
        
        expect(onSaveMock).toHaveBeenCalledWith('Updated Value');
    });
});
