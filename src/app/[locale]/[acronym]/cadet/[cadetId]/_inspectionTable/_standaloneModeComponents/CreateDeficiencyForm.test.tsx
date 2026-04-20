import { createDeficiency } from "@/dal/inspection/deficiency";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mutate } from "swr";
import { toast } from "react-toastify";
import { CreateDeficiencyForm } from "./CreateDeficiencyForm";

vi.mock('next/navigation', async () => {
    const actual = await vi.importActual('next/navigation');
    return {
        ...actual,
        useParams: vi.fn().mockReturnValue({ cadetId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    };
});

vi.mock('@/dal/inspection/deficiency', () => ({
    createDeficiency: vi.fn(),
}));

vi.mock('swr', async (importOriginal) => {
    const actual = await importOriginal() as Record<string, unknown>;
    return { ...actual, mutate: vi.fn() };
});

vi.mock('@/dataFetcher/deficiency', () => ({
    useDeficiencyTypes: vi.fn().mockReturnValue({
        deficiencyTypeList: [
            { id: '97d25d1c-15cc-43fb-a2f3-5b21d0ffd8cd', name: 'Cadet Issue', dependent: 'cadet', relation: null },
        ],
    }),
}));

vi.mock('@/dataFetcher/cadet', () => ({
    useCadetUniformDescriptList: vi.fn().mockReturnValue({ uniformLabels: [] }),
}));

vi.mock('@/dataFetcher/material', () => ({
    useMaterialConfiguration: vi.fn().mockReturnValue({ config: [] }),
}));

describe('CreateDeficiencyForm', () => {
    const onSaved = vi.fn();
    const onCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(createDeficiency).mockResolvedValue(undefined);
        vi.mocked(mutate).mockResolvedValue(undefined);
    });

    const renderForm = () =>
        render(<CreateDeficiencyForm onSaved={onSaved} onCancel={onCancel} />);

    it('calls createDeficiency with correct data on submit', async () => {
        const user = userEvent.setup();
        renderForm();

        await user.selectOptions(screen.getByLabelText(/common.type/i), '97d25d1c-15cc-43fb-a2f3-5b21d0ffd8cd');
        await user.type(screen.getByLabelText(/common.description/i), 'E2E New Deficiency');
        await user.type(screen.getByLabelText(/common.comment/i), 'E2E New Comment');
        await user.click(screen.getByTestId('btn_save_new_deficiency'));

        await waitFor(() => {
            expect(createDeficiency).toHaveBeenCalledWith(
                expect.objectContaining({
                    typeId: '97d25d1c-15cc-43fb-a2f3-5b21d0ffd8cd',
                    comment: 'E2E New Comment',
                    cadetId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                })
            );
        });
    });

    it('calls mutate and onSaved on successful creation', async () => {
        const user = userEvent.setup();
        renderForm();

        await user.selectOptions(screen.getByLabelText(/common.type/i), '97d25d1c-15cc-43fb-a2f3-5b21d0ffd8cd');
        await user.type(screen.getByLabelText(/common.comment/i), 'Some Comment');
        await user.click(screen.getByTestId('btn_save_new_deficiency'));

        await waitFor(() => {
            expect(mutate).toHaveBeenCalled();
            expect(onSaved).toHaveBeenCalled();
        });
    });

    it('shows success toast on successful creation', async () => {
        const user = userEvent.setup();
        renderForm();

        await user.selectOptions(screen.getByLabelText(/common.type/i), '97d25d1c-15cc-43fb-a2f3-5b21d0ffd8cd');
        await user.type(screen.getByLabelText(/common.comment/i), 'Some Comment');
        await user.click(screen.getByTestId('btn_save_new_deficiency'));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalled();
        });
    });

    it('shows error toast on failed creation', async () => {
        vi.mocked(createDeficiency).mockRejectedValueOnce(new Error('fail'));
        const user = userEvent.setup();
        renderForm();

        await user.selectOptions(screen.getByLabelText(/common.type/i), '97d25d1c-15cc-43fb-a2f3-5b21d0ffd8cd');
        await user.type(screen.getByLabelText(/common.comment/i), 'Some Comment');
        await user.click(screen.getByTestId('btn_save_new_deficiency'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalled();
        });
    });

    it('calls onCancel when cancel button is clicked', async () => {
        const user = userEvent.setup();
        renderForm();

        await user.click(screen.getByTestId('btn_cancel_new_deficiency'));
        expect(onCancel).toHaveBeenCalled();
    });
});
