// NOTE: The following imports and utilities will be used when implementing the actual tests
import React from 'react';
import { getByTestId, getByText, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form';
import { CadetInspectionFormSchema } from '@/zod/deficiency';
import { Deficiency } from '@/types/deficiencyTypes';
import OldDeficiencyRow from './OldDeficiencyRow2';

// Mock data for testing
const mockDeficiency: Deficiency = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    typeId: '987fcdeb-51a2-43d1-b123-456789abcdef',
    typeName: 'Uniform',
    description: 'Missing button on jacket',
    comment: 'Left chest button is loose and falling off',
    dateCreated: new Date('2024-01-15T10:30:00Z'),
    dateUpdated: new Date('2024-01-15T10:30:00Z'),
    dateResolved: null,
    userCreated: 'inspector1',
    userUpdated: 'inspector1',
    userResolved: null,
};

// Test wrapper component that provides React Hook Form context
interface TestWrapperProps {
    children: React.ReactNode;
    defaultValues?: Partial<CadetInspectionFormSchema>;
    onMethodsReady?: (methods: UseFormReturn<CadetInspectionFormSchema>) => void;
}

const TestWrapper: React.FC<TestWrapperProps> = ({
    children,
    defaultValues = {},
    onMethodsReady
}) => {
    const methods = useForm<CadetInspectionFormSchema>({
        defaultValues: {
            cadetId: '550e8400-e29b-41d4-a716-446655440000',
            uniformComplete: false,
            oldDeficiencyList: [
                {
                    id: mockDeficiency.id!,
                    typeId: mockDeficiency.typeId,
                    typeName: mockDeficiency.typeName,
                    description: mockDeficiency.description,
                    comment: mockDeficiency.comment,
                    dateCreated: mockDeficiency.dateCreated!,
                    resolved: false,
                }
            ],
            newDeficiencyList: [],
            ...defaultValues,
        },
    });

    // Expose form methods to tests when needed
    React.useEffect(() => {
        if (onMethodsReady) {
            onMethodsReady(methods);
        }
    }, [methods, onMethodsReady]);

    return (
        <FormProvider {...methods}>
            {children}
        </FormProvider>
    );
};
const renderWithForm = (
    props = defaultProps,
    options: {
        formDefaults?: Partial<CadetInspectionFormSchema>;
        onMethodsReady?: (methods: UseFormReturn<CadetInspectionFormSchema>) => void;
    } = {}
) => {
    const { formDefaults, onMethodsReady } = options;

    return render(
        <TestWrapper defaultValues={formDefaults} onMethodsReady={onMethodsReady}>
            <OldDeficiencyRow {...props} />
        </TestWrapper>
    );
};

// Default props for the component
const defaultProps = {
    index: 0,
    step: 1,
    deficiency: mockDeficiency,
};

describe('OldDeficiencyRow', () => {
    beforeEach(() => {
        // Clear any previous mocks between tests
        jest.clearAllMocks();
    });

    describe('Basic Rendering', () => {
        // Helper function to render component with form context
        it('should render correctly with all basic elements and data', () => {
            renderWithForm();

            // Check main container exists with correct test id and CSS classes
            const container = screen.getByTestId(`div_olddef_${mockDeficiency.id}`);
            expect(container).toBeInTheDocument();
            expect(container).toHaveClass('p-1', 'm-0', 'border-bottom', 'border-1', 'py-3');

            // Check all data is displayed correctly
            expect(screen.getByTestId('div_description')).toHaveTextContent(mockDeficiency.description);
            expect(screen.getByTestId('div_type')).toHaveTextContent(mockDeficiency.typeName);

            // Check i18n labels are present
            expect(screen.getByText('common.description')).toBeInTheDocument();
            expect(screen.getByText('common.type')).toBeInTheDocument();
        });

        it('should render with custom deficiency data', () => {
            const customDeficiency: Deficiency = {
                ...mockDeficiency,
                id: 'custom-id-123',
                description: 'Custom deficiency description',
                typeName: 'Custom Type',
            };

            renderWithForm({ ...defaultProps, deficiency: customDeficiency });

            expect(screen.getByTestId('div_olddef_custom-id-123')).toBeInTheDocument();
            expect(screen.getByText('Custom deficiency description')).toBeInTheDocument();
            expect(screen.getByText('Custom Type')).toBeInTheDocument();
        });
    });

    describe('Step-Based Conditional Rendering', () => {
        it('should render correctly for step 0 with extended view but no switch', () => {
            renderWithForm({ ...defaultProps, step: 0 });

            // Step != 1: Resolution switch should NOT be visible
            expect(screen.queryByTestId('chk_resolved')).not.toBeInTheDocument();

            // Step >= 2: Creation date and comment should NOT be visible
            expect(screen.getByTestId('div_created')).toBeInTheDocument();
            expect(screen.getByTestId('div_comment')).toBeInTheDocument();
            expect(screen.getByText('common.dates.created')).toBeInTheDocument();
            expect(screen.getByText('common.comment')).toBeInTheDocument();

            // Step != 2: Should have py-3 class
            const container = screen.getByTestId(`div_olddef_${mockDeficiency.id}`);
            expect(container).toHaveClass('py-3');
            expect(container).not.toHaveClass('py-1');

            // Basic elements should always be visible
            expect(screen.getByTestId('div_description')).toBeInTheDocument();
            expect(screen.getByTestId('div_type')).toBeInTheDocument();
            expect(screen.getByText('common.description')).toBeInTheDocument();
            expect(screen.getByText('common.type')).toBeInTheDocument();
            expect(screen.getByText(mockDeficiency.description)).toBeInTheDocument();
            expect(screen.getByText(mockDeficiency.typeName)).toBeInTheDocument();
        });
        it('should render correctly for step 1 with all elements visible', () => {
            renderWithForm({ ...defaultProps, step: 1 });

            // Step 1: Resolution switch should be visible
            expect(screen.getByTestId('chk_resolved')).toBeInTheDocument();

            // Step < 2: Creation date and comment should be visible
            expect(screen.getByTestId('div_created')).toBeInTheDocument();
            expect(screen.getByTestId('div_comment')).toBeInTheDocument();
            expect(screen.getByText('common.dates.created')).toBeInTheDocument();
            expect(screen.getByText('common.comment')).toBeInTheDocument();

            // Step != 2: Should have py-3 class
            const container = screen.getByTestId(`div_olddef_${mockDeficiency.id}`);
            expect(container).toHaveClass('py-3');
            expect(container).not.toHaveClass('py-1');

            // Basic elements should always be visible
            expect(screen.getByTestId('div_description')).toBeInTheDocument();
            expect(screen.getByTestId('div_type')).toBeInTheDocument();
            expect(screen.getByText('common.description')).toBeInTheDocument();
            expect(screen.getByText('common.type')).toBeInTheDocument();
            expect(screen.getByText(mockDeficiency.description)).toBeInTheDocument();
            expect(screen.getByText(mockDeficiency.typeName)).toBeInTheDocument();
        });

        it('should render correctly for step 2 with minimal view', () => {
            renderWithForm({ ...defaultProps, step: 2 });

            // Step != 1: Resolution switch should NOT be visible
            expect(screen.queryByTestId('chk_resolved')).not.toBeInTheDocument();

            // Step >= 2: Creation date and comment should NOT be visible
            expect(screen.queryByTestId('div_created')).not.toBeInTheDocument();
            expect(screen.queryByTestId('div_comment')).not.toBeInTheDocument();
            expect(screen.queryByText('common.dates.created')).not.toBeInTheDocument();
            expect(screen.queryByText('common.comment')).not.toBeInTheDocument();

            // Step == 2: Should have py-1 class
            const container = screen.getByTestId(`div_olddef_${mockDeficiency.id}`);
            expect(container).toHaveClass('py-1');
            expect(container).not.toHaveClass('py-3');

            // Basic elements should always be visible
            expect(screen.getByTestId('div_description')).toBeInTheDocument();
            expect(screen.getByTestId('div_type')).toBeInTheDocument();
            expect(screen.getByText('common.description')).toBeInTheDocument();
            expect(screen.getByText('common.type')).toBeInTheDocument();
            expect(screen.getByText(mockDeficiency.description)).toBeInTheDocument();
            expect(screen.getByText(mockDeficiency.typeName)).toBeInTheDocument();
        });
    });

    describe('Form Integration', () => {
        it('should integrate correctly with React Hook Form and display initial values', () => {
            let formMethods: UseFormReturn<CadetInspectionFormSchema>;
            const onMethodsReady = (methods: UseFormReturn<CadetInspectionFormSchema>) => {
                formMethods = methods;
            };

            const initialFormData = {
                oldDeficiencyList: [
                    {
                        id: mockDeficiency.id!,
                        resolved: true,
                        typeName: mockDeficiency.typeName,
                        description: mockDeficiency.description,
                        comment: mockDeficiency.comment,
                        dateCreated: mockDeficiency.dateCreated!,
                        typeId: mockDeficiency.typeId
                    }
                ]
            };

            renderWithForm(
                { ...defaultProps, step: 1 },
                { formDefaults: initialFormData, onMethodsReady }
            );

            // Form should be properly initialized
            expect(formMethods!.formState).toBeDefined();
            expect(formMethods!.getValues().oldDeficiencyList[0].resolved).toBe(true);

            // Switch should be rendered and show initial value
            const switchElement = screen.getByTestId('chk_resolved');
            expect(switchElement).toBeInTheDocument();
            expect(switchElement).toBeChecked();

            // Label should reflect the initial resolved state
            expect(screen.getByText('common.deficiency.resolved.true')).toBeInTheDocument();
        });

        it('should update form state and UI when switch is toggled', async () => {
            let formMethods: UseFormReturn<CadetInspectionFormSchema>;
            const onMethodsReady = (methods: UseFormReturn<CadetInspectionFormSchema>) => {
                formMethods = methods;
            };

            const initialFormData = {
                oldDeficiencyList: [
                    {
                        id: mockDeficiency.id!,
                        resolved: false,
                        typeName: mockDeficiency.typeName,
                        description: mockDeficiency.description,
                        comment: mockDeficiency.comment,
                        dateCreated: mockDeficiency.dateCreated!,
                        typeId: mockDeficiency.typeId
                    }
                ]
            };

            renderWithForm(
                { ...defaultProps, step: 1 },
                { formDefaults: initialFormData, onMethodsReady }
            );

            // Initial state: unresolved
            const switchElement = screen.getByTestId('chk_resolved');
            expect(switchElement).not.toBeChecked();
            expect(screen.getByText('common.deficiency.resolved.false')).toBeInTheDocument();
            expect(formMethods!.getValues().oldDeficiencyList[0].resolved).toBe(false);

            // Toggle the switch
            await userEvent.click(switchElement);

            // Form state should be updated
            expect(formMethods!.getValues().oldDeficiencyList[0].resolved).toBe(true);

            // UI should reflect the change
            expect(switchElement).toBeChecked();
            expect(screen.getByText('common.deficiency.resolved.true')).toBeInTheDocument();

        });

        it('should handle different resolved states and maintain form context integrity', async () => {
            let formMethods: UseFormReturn<CadetInspectionFormSchema>;
            const onMethodsReady = (methods: UseFormReturn<CadetInspectionFormSchema>) => {
                formMethods = methods;
            };
            const formData = {
                oldDeficiencyList: [
                    {
                        id: '1',
                        resolved: true,
                        typeName: 'Type1',
                        description: 'Desc1',
                        comment: 'Comment1',
                        dateCreated: new Date(),
                        typeId: 'type1'
                    },
                    {
                        id: '2',
                        resolved: false,
                        typeName: 'Type2',
                        description: 'Desc2',
                        comment: 'Comment2',
                        dateCreated: new Date(),
                        typeId: 'type2'
                    }
                ]
            };

            render(
                <TestWrapper defaultValues={formData} onMethodsReady={onMethodsReady}>
                    <OldDeficiencyRow
                        index={0}
                        step={1}
                        deficiency={formData.oldDeficiencyList[0]}
                    />
                    <OldDeficiencyRow
                        index={1}
                        step={1}
                        deficiency={formData.oldDeficiencyList[1]}
                    />
                </TestWrapper>
            )

            // First instance should show resolved state
            const firstRow = screen.getByTestId('div_olddef_1');
            expect(firstRow).toBeInTheDocument();
            expect(getByTestId(firstRow, 'chk_resolved')).toBeChecked();
            expect(getByText(firstRow, 'common.deficiency.resolved.true')).toBeInTheDocument();
            expect(formMethods!.getValues().oldDeficiencyList[0].resolved).toBe(true);

            // Second instance should show unresolved state
            const secondRow = screen.getByTestId('div_olddef_2');
            expect(secondRow).toBeInTheDocument();
            expect(getByTestId(secondRow, 'chk_resolved')).not.toBeChecked();
            expect(getByText(secondRow, 'common.deficiency.resolved.false')).toBeInTheDocument();
            expect(formMethods!.getValues().oldDeficiencyList[1].resolved).toBe(false);

            // Toggle first row
            await userEvent.click(getByTestId(firstRow, 'chk_resolved'));
            expect(getByTestId(firstRow, 'chk_resolved')).not.toBeChecked();
            expect(getByText(firstRow, 'common.deficiency.resolved.false')).toBeInTheDocument();
            expect(formMethods!.getValues().oldDeficiencyList[0].resolved).toBe(false);
        });
    });

    describe('Dynamic Styling', () => {
        it('should apply correct CSS classes based on step and resolved state', async () => {
            const resolvedFormData = {
                oldDeficiencyList: [
                    {
                        id: mockDeficiency.id!,
                        resolved: true,
                        typeName: mockDeficiency.typeName,
                        description: mockDeficiency.description,
                        comment: mockDeficiency.comment,
                        dateCreated: mockDeficiency.dateCreated!,
                        typeId: mockDeficiency.typeId
                    }
                ]
            };

            // Test step 2 styling (minimal padding)
            const { rerender } = renderWithForm(
                { ...defaultProps, step: 2 },
                { formDefaults: resolvedFormData }
            );

            let container = screen.getByTestId(`div_olddef_${mockDeficiency.id}`);
            expect(container).toHaveClass('py-1');
            expect(container).not.toHaveClass('py-3');

            // Test other step styling (normal padding)
            rerender(
                <TestWrapper defaultValues={resolvedFormData}>
                    <OldDeficiencyRow {...defaultProps} step={1} />
                </TestWrapper>
            );

            container = screen.getByTestId(`div_olddef_${mockDeficiency.id}`);
            expect(container).toHaveClass('py-3');
            expect(container).not.toHaveClass('py-1');

            const checkbox = screen.getByTestId('chk_resolved');
            // eslint-disable-next-line testing-library/no-node-access
            const parent = checkbox.closest('div');
            expect(parent).toHaveClass(/text-success/);

            await userEvent.click(checkbox);
            expect(parent).toHaveClass(/text-danger/);
        });
    });

    describe('Data Display', () => {
        it('should display formatted data correctly', () => {
            const customDeficiency = {
                ...mockDeficiency,
                description: 'Special Description with Symbols & Characters',
                typeName: 'Special/Type:Name',
                comment: 'Comment with "quotes" and symbols @#$%',
                dateCreated: new Date('2023-06-15T10:30:00.000Z')
            };

            renderWithForm({
                ...defaultProps,
                step: 1,
                deficiency: customDeficiency
            });

            // Check all data is displayed correctly
            expect(screen.getByText('Special Description with Symbols & Characters')).toBeInTheDocument();
            expect(screen.getByText('Special/Type:Name')).toBeInTheDocument();
            expect(screen.getByText('Comment with "quotes" and symbols @#$%')).toBeInTheDocument();

            // Date should be formatted according to locale
            expect(screen.getByText('15.06.2023')).toBeInTheDocument();
        });
    });
});
