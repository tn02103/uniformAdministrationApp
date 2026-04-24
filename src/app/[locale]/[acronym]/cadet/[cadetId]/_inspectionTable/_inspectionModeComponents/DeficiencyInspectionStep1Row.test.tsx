import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form';
import { CadetInspectionFormSchema } from '@/zod/deficiency';
import { DeficiencyInspectionStep1Row } from './DeficiencyInspectionStep1Row';

const mockDeficiency = {
    id: 'def-111',
    typeId: 'type-1',
    typeName: 'Uniform',
    description: 'Missing button',
    comment: 'Left chest',
    dateCreated: new Date('2024-03-10T00:00:00Z'),
    resolved: false,
};

interface WrapperProps {
    children: React.ReactNode;
    defaultValues?: Partial<CadetInspectionFormSchema>;
    onMethodsReady?: (methods: UseFormReturn<CadetInspectionFormSchema>) => void;
}

const TestWrapper: React.FC<WrapperProps> = ({ children, defaultValues = {}, onMethodsReady }) => {
    const methods = useForm<CadetInspectionFormSchema>({
        defaultValues: {
            cadetId: 'cadet-1',
            uniformComplete: false,
            oldDeficiencyList: [{ ...mockDeficiency, resolved: false }],
            newDeficiencyList: [],
            ...defaultValues,
        },
    });

    React.useEffect(() => {
        if (onMethodsReady) onMethodsReady(methods);
    }, [methods, onMethodsReady]);

    return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('DeficiencyInspectionStep1Row', () => {
    describe('Rendering', () => {
        it('renders deficiency data correctly', () => {
            render(
                <TestWrapper>
                    <DeficiencyInspectionStep1Row deficiency={mockDeficiency} index={0} />
                </TestWrapper>
            );

            expect(screen.getByTestId(`div_olddef_${mockDeficiency.id}`)).toBeInTheDocument();
            expect(screen.getByTestId('div_description')).toHaveTextContent(mockDeficiency.description);
            expect(screen.getByTestId('div_type')).toHaveTextContent(mockDeficiency.typeName);
            expect(screen.getByTestId('div_created')).toBeInTheDocument();
            expect(screen.getByTestId('div_comment')).toHaveTextContent(mockDeficiency.comment);
        });

        it('renders the resolve toggle switch', () => {
            render(
                <TestWrapper>
                    <DeficiencyInspectionStep1Row deficiency={mockDeficiency} index={0} />
                </TestWrapper>
            );

            expect(screen.getByRole('switch')).toBeInTheDocument();
        });

        it('shows resolved.false label for unresolved deficiency', () => {
            render(
                <TestWrapper>
                    <DeficiencyInspectionStep1Row deficiency={mockDeficiency} index={0} />
                </TestWrapper>
            );

            expect(screen.getByText('common.deficiency.resolved.false')).toBeInTheDocument();
        });

        it('shows resolved.true label for resolved deficiency', () => {
            render(
                <TestWrapper defaultValues={{ oldDeficiencyList: [{ ...mockDeficiency, resolved: true }] }}>
                    <DeficiencyInspectionStep1Row deficiency={{ ...mockDeficiency, resolved: true }} index={0} />
                </TestWrapper>
            );

            expect(screen.getByText('common.deficiency.resolved.true')).toBeInTheDocument();
        });
    });

    describe('Form integration', () => {
        it('toggles form state and UI when switch is clicked', async () => {
            const user = userEvent.setup();
            let formMethods: UseFormReturn<CadetInspectionFormSchema>;

            render(
                <TestWrapper onMethodsReady={(m) => { formMethods = m; }}>
                    <DeficiencyInspectionStep1Row deficiency={mockDeficiency} index={0} />
                </TestWrapper>
            );

            const toggle = screen.getByRole('switch');
            expect(toggle).not.toBeChecked();
            expect(formMethods!.getValues().oldDeficiencyList[0].resolved).toBe(false);

            await user.click(toggle);

            expect(toggle).toBeChecked();
            expect(formMethods!.getValues().oldDeficiencyList[0].resolved).toBe(true);
        });

        it('maintains independent state for each row when multiple rows are rendered', async () => {
            const user = userEvent.setup();
            const twoDeficiencies = [
                { ...mockDeficiency, id: 'def-a', resolved: true },
                { ...mockDeficiency, id: 'def-b', resolved: false },
            ];
            let formMethods: UseFormReturn<CadetInspectionFormSchema>;

            render(
                <TestWrapper
                    defaultValues={{ oldDeficiencyList: twoDeficiencies }}
                    onMethodsReady={(m) => { formMethods = m; }}
                >
                    <DeficiencyInspectionStep1Row deficiency={twoDeficiencies[0]} index={0} />
                    <DeficiencyInspectionStep1Row deficiency={twoDeficiencies[1]} index={1} />
                </TestWrapper>
            );

            const rowA = screen.getByTestId('div_olddef_def-a');
            const rowB = screen.getByTestId('div_olddef_def-b');
            const switchA = rowA.querySelector('input[role="switch"]') as HTMLInputElement;
            const switchB = rowB.querySelector('input[role="switch"]') as HTMLInputElement;

            expect(switchA).toBeChecked();
            expect(switchB).not.toBeChecked();

            await user.click(switchA);

            expect(switchA).not.toBeChecked();
            expect(switchB).not.toBeChecked();
            expect(formMethods!.getValues().oldDeficiencyList[0].resolved).toBe(false);
            expect(formMethods!.getValues().oldDeficiencyList[1].resolved).toBe(false);
        });
    });
});
