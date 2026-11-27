import { createDeficiency } from "@/dal/inspection/deficiency";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mutate } from "swr";
import { toast } from "react-toastify";
import { CreateDeficiencyForm } from "./CreateDeficiencyForm";

const cadetId = '2dcbe30e-0737-4b92-b748-96bf35c374d5';
const deficiencyTypeId = 'd3e8e4c7-5e41-48ef-829c-64531aab8c9a';

vi.mock('next/navigation', async () => {
    const actual = await vi.importActual('next/navigation');
    return {
        ...actual,
        useParams: vi.fn().mockReturnValue({ cadetId: '2dcbe30e-0737-4b92-b748-96bf35c374d5' }),
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
            { id: 'd3e8e4c7-5e41-48ef-829c-64531aab8c9a', name: 'Cadet Issue', dependent: 'cadet', relation: null },
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

        await user.selectOptions(screen.getByLabelText(/common.type/i), deficiencyTypeId);
        await user.type(screen.getByLabelText(/common.description/i), 'E2E New Deficiency');
        await user.type(screen.getByLabelText(/common.comment/i), 'E2E New Comment');
        await user.click(screen.getByTestId('btn_save_new_deficiency'));

        await waitFor(() => {
            expect(createDeficiency).toHaveBeenCalledWith(
                expect.objectContaining({
                    typeId: deficiencyTypeId,
                    comment: 'E2E New Comment',
                    cadetId,
                })
            );
        });
    });

    it('calls mutate and onSaved on successful creation', async () => {
        const user = userEvent.setup();
        renderForm();

        await user.selectOptions(screen.getByLabelText(/common.type/i), deficiencyTypeId);
        await user.type(screen.getByLabelText(/common.description/i), 'Some Description');
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

        await user.selectOptions(screen.getByLabelText(/common.type/i), deficiencyTypeId);
        await user.type(screen.getByLabelText(/common.description/i), 'Some Description');
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

        await user.selectOptions(screen.getByLabelText(/common.type/i), deficiencyTypeId);
        await user.type(screen.getByLabelText(/common.description/i), 'Some Description');
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
