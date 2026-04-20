import userEvent from "@testing-library/user-event";
import { Form } from "@/components/fields/Form";
import { render, screen } from "@testing-library/react";
import { CadetInspectionStep1, CadetInspectionStep1Props } from "./CadetInspectionStep1";
import { DeficiencyInspectionStep1Row } from "./DeficiencyInspectionStep1Row";

const mockOldDeficiencyList = [
    { id: '1', description: 'Old deficiency 1' },
    { id: '2', description: 'Old deficiency 2' },
    { id: '3', description: 'Old deficiency 3' },
];
const mockFormData = {
    oldDeficiencyList: mockOldDeficiencyList
}

vi.mock('./DeficiencyInspectionStep1Row', () => ({
    DeficiencyInspectionStep1Row: vi.fn((data) => <div>{data.deficiency.description}</div>)
}));

describe('<CadetInspectionStep1 />', () => {
    const MockComponent = ({ cancel, setNextStep }: Partial<CadetInspectionStep1Props>) => {
        return (
            <Form onSubmit={vi.fn()} defaultValues={mockFormData}>
                <CadetInspectionStep1 cancel={cancel ? cancel : vi.fn()} setNextStep={setNextStep ? setNextStep : vi.fn()} />
            </Form>
        );
    };

    it('should render correctly', () => {
        render(<MockComponent />);

        expect(screen.getByText('Old deficiency 1')).toBeInTheDocument();
        expect(screen.getByText('Old deficiency 2')).toBeInTheDocument();
        expect(screen.getByText('Old deficiency 3')).toBeInTheDocument();

        expect(DeficiencyInspectionStep1Row).toHaveBeenCalledTimes(3);
        expect(DeficiencyInspectionStep1Row).toHaveBeenCalledWith(
            { deficiency: mockOldDeficiencyList[0], index: 0 },
            undefined
        );
        expect(DeficiencyInspectionStep1Row).toHaveBeenCalledWith(
            { deficiency: mockOldDeficiencyList[1], index: 1 },
            undefined
        );
        expect(DeficiencyInspectionStep1Row).toHaveBeenCalledWith(
            { deficiency: mockOldDeficiencyList[2], index: 2 },
            undefined
        );

        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /nextStep/i })).toBeInTheDocument();
    });

    it('should call cancel function when cancel button is clicked', async () => {
        const user = userEvent.setup();
        const cancelMock = vi.fn();
        render(<MockComponent cancel={cancelMock} />);

        await user.click(screen.getByRole('button', { name: /cancel/i }));
        expect(cancelMock).toHaveBeenCalledTimes(1);
    });

    it('should call nextStep function when nextStep button is clicked', async () => {
        const user = userEvent.setup();
        const setNextStep = vi.fn();
        render(<MockComponent setNextStep={setNextStep} />);

        await user.click(screen.getByRole('button', { name: /nextStep/i }));
        expect(setNextStep).toHaveBeenCalledTimes(1);
    });
});
