import { Form } from "@/components/fields/Form";
import { getByRole, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CadetInspectionStep2 } from "./CadetInspectionStep2";


const mockFormData = {
    oldDeficiencyList: [
        { id: '1', description: 'Old deficiency 1' },
        { id: '2', description: 'Old deficiency 2' },
        { id: '3', description: 'Old deficiency 3' },
    ],
    newDeficiencyList: [
        { type: 'new', description: 'New deficiency 1' },
        { type: 'new', description: 'New deficiency 2' },
    ],
};

jest.mock('./OldDeficiencyRow', () => ({
    OldDeficiencyRow: jest.fn(({ deficiency }) => <div>{deficiency.description}</div>)
}));

jest.mock('./NewDeficiencyRow', () => ({
    NewDeficiencyRow: jest.fn(({ index, remove }) => (
        <div data-testid={`new-deficiency-${index}`}>
            <p>{`New deficiency ${index + 1}`}</p>
            <button onClick={remove}>remove</button>
        </div>
    ))
}));

jest.mock('@/dataFetcher/cadet', () => ({
    useCadetUniformComplete: jest.fn(),
}))

const TestFormWrapper = ({ setStep, onSubmit, defaultValues }: { setStep?: (step: number) => void, onSubmit?: () => void, defaultValues?: object }) => {

    return (
        <Form onSubmit={onSubmit ?? jest.fn()} defaultValues={{ ...mockFormData, ...defaultValues }}>
            <CadetInspectionStep2
                setStep={setStep ?? jest.fn()}
            />
        </Form>
    );
};

describe('<CadetInspectionStep2 />', () => {
    const { OldDeficiencyRow } = jest.requireMock('./OldDeficiencyRow');
    const { NewDeficiencyRow } = jest.requireMock('./NewDeficiencyRow');
    const { useCadetUniformComplete } = jest.requireMock('@/dataFetcher/cadet');
    const { useParams } = jest.requireMock('next/navigation');

    beforeEach(() => {
        jest.clearAllMocks();

        useCadetUniformComplete.mockReturnValue(true);
        useParams.mockReturnValue({ cadetId: '123' });
    })

    it('renders unresolved oldDeficiencyList', () => {
        render(<TestFormWrapper />);


        expect(screen.getByText('Old deficiency 1')).toBeInTheDocument();
        expect(screen.getByText('Old deficiency 2')).toBeInTheDocument();
        expect(screen.getByText('Old deficiency 3')).toBeInTheDocument();

        expect(OldDeficiencyRow).toHaveBeenCalledTimes(3);
        expect(OldDeficiencyRow).toHaveBeenCalledWith(
            { deficiency: mockFormData.oldDeficiencyList[0], step: 2, index: 0 },
            undefined
        );
        expect(OldDeficiencyRow).toHaveBeenCalledWith(
            { deficiency: mockFormData.oldDeficiencyList[1], step: 2, index: 1 },
            undefined
        );
        expect(OldDeficiencyRow).toHaveBeenCalledWith(
            { deficiency: mockFormData.oldDeficiencyList[2], step: 2, index: 2 },
            undefined
        );
    });

    it('renders uniform complete, incomplete', () => {
        useCadetUniformComplete.mockReturnValue(true);
        const { rerender } = render(<TestFormWrapper />);
        expect(screen.getByText(/uniformComplete.true/)).toBeInTheDocument();
        expect(screen.getByText(/uniformComplete.true/)).toHaveClass('text-success');

        useCadetUniformComplete.mockReturnValue(false);
        rerender(<TestFormWrapper />);
        expect(screen.getByText(/uniformComplete.false/)).toBeInTheDocument();
        expect(screen.getByText(/uniformComplete.false/)).toHaveClass('text-danger');
    });

    it('renders existing new deficiencies', () => {
        render(<TestFormWrapper />);
        expect(screen.getByText("New deficiency 1")).toBeInTheDocument();
        expect(screen.getByText("New deficiency 2")).toBeInTheDocument();

        expect(NewDeficiencyRow).toHaveBeenCalledTimes(2);
        expect(NewDeficiencyRow).toHaveBeenCalledWith(
            { index: 0, remove: expect.any(Function) },
            undefined
        );
        expect(NewDeficiencyRow).toHaveBeenCalledWith(
            { index: 1, remove: expect.any(Function) },
            undefined
        );
    });

    it('adds newDeficiencyRow', async () => {
        render(<TestFormWrapper defaultValues={{ newDeficiencyList: [] }} />);

        const addNewButton = screen.getByRole('button', { name: /create/i });
        expect(addNewButton).toBeInTheDocument();

        expect(NewDeficiencyRow).toHaveBeenCalledTimes(0);

        await userEvent.click(addNewButton);
        expect(NewDeficiencyRow).toHaveBeenCalledTimes(1);
        expect(NewDeficiencyRow).toHaveBeenCalledWith(
            { index: 0, remove: expect.any(Function) },
            undefined
        );
    });

    it('removes newDeficiencyRow', async () => {
        render(<TestFormWrapper />);

        expect(screen.getAllByTestId(/^new-deficiency-/)).toHaveLength(2);
        const firstDeficiency = screen.getByTestId("new-deficiency-0");

        const removeButton = getByRole(firstDeficiency, 'button', { name: /remove/i });
        expect(removeButton).toBeInTheDocument();

        await userEvent.click(removeButton);
        expect(screen.getAllByTestId(/^new-deficiency-/)).toHaveLength(1);
    });

    describe('footer buttons', () => {
        it('returns to step 0 with no oldDeficiencies', async () => {
            const setStep = jest.fn();
            render(<TestFormWrapper setStep={setStep} defaultValues={{ oldDeficiencyList: [] }} />);

            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            expect(cancelButton).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /prevStep/i })).toBeNull();

            await userEvent.click(cancelButton);
            expect(setStep).toHaveBeenCalledWith(0);
        });

        it('returns to step 1 with oldDeficiencies', async () => {
            const setStep = jest.fn();
            render(<TestFormWrapper setStep={setStep} />);

            const returnButton = screen.getByRole('button', { name: /prevStep/i });
            expect(returnButton).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /cancel/i })).toBeNull();

            await userEvent.click(returnButton);
            expect(setStep).toHaveBeenCalledWith(1);
        });

        it('submits the form', async () => {
            const onSubmit = jest.fn();
            render(<TestFormWrapper onSubmit={onSubmit} />);
            const submitButton = screen.getByRole('button', { name: /save/i });
            expect(submitButton).toBeInTheDocument();

            await userEvent.click(submitButton);
            expect(onSubmit).toHaveBeenCalled();
        });
    });
});
