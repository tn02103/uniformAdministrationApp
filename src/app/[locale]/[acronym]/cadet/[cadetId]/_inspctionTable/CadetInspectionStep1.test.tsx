import { Form } from "@/components/fields/Form";
import { render, screen } from "@testing-library/react";
import { CadetInspectionStep1, CadetInspectionStep1Props } from "./CadetInspectionStep1";


const mockOldDeficiencyList = [
    { id: '1', description: 'Old deficiency 1' },
    { id: '2', description: 'Old deficiency 2' },
    { id: '3', description: 'Old deficiency 3' },
];
const mockFormData = {
    oldDeficiencyList: mockOldDeficiencyList
}

jest.mock('./OldDeficiencyRow', () => ({
    OldDeficiencyRow: jest.fn((data) => <div>{data.deficiency.description}</div>)
}));

describe('<CadetInspectionStep1 />', () => {
    const { OldDeficiencyRow } = jest.requireMock('./OldDeficiencyRow')

    const MockComponent = ({ cancel, setNextStep }: Partial<CadetInspectionStep1Props>) => {
        return (
            <Form onSubmit={jest.fn()} defaultValues={mockFormData}>
                <CadetInspectionStep1 cancel={cancel ? cancel : jest.fn()} setNextStep={setNextStep ? setNextStep : jest.fn()} />
            </Form>
        );
    };

    it('should render correctly', () => {
        render(<MockComponent />);

        expect(screen.getByText('Old deficiency 1')).toBeInTheDocument();
        expect(screen.getByText('Old deficiency 2')).toBeInTheDocument();
        expect(screen.getByText('Old deficiency 3')).toBeInTheDocument();

        expect(OldDeficiencyRow).toHaveBeenCalledTimes(6);
        expect(OldDeficiencyRow).toHaveBeenCalledWith(
            { deficiency: mockOldDeficiencyList[0], index: 0, step: 1 },
            undefined
        );
        expect(OldDeficiencyRow).toHaveBeenCalledWith(
            { deficiency: mockOldDeficiencyList[1], index: 1, step: 1 }, 
            undefined
        );
        expect(OldDeficiencyRow).toHaveBeenCalledWith(
            { deficiency: mockOldDeficiencyList[2], index: 2, step: 1 },
            undefined
        );

        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /nextStep/i })).toBeInTheDocument();
    });

    it('should call cancel function when cancel button is clicked', () => {
        const cancelMock = jest.fn();
        render(<MockComponent cancel={cancelMock} />);

        screen.getByRole('button', { name: /cancel/i }).click();
        expect(cancelMock).toHaveBeenCalledTimes(1);
    });

    it('should call nextStep function when nextStep button is clicked', () => {
        const setNextStep = jest.fn();
        render(<MockComponent setNextStep={setNextStep} />);

        screen.getByRole('button', { name: /nextStep/i }).click();
        expect(setNextStep).toHaveBeenCalledTimes(1);
    });
});
