import { MaterialGroup } from '@/types/globalMaterialTypes';
import { deficiencytype_dependent, deficiencytype_relation } from '@/prisma/enums';
import { CadetInspectionFormSchema } from '@/zod/deficiency';
import { getAllByRole, render, screen } from '@testing-library/react';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { NewDeficiencyRow } from './NewDeficiencyRow';
import { useDeficiencyTypes } from '@/dataFetcher/deficiency';
import { useCadetUniformDescriptList } from '@/dataFetcher/cadet';
import { useMaterialConfiguration } from '@/dataFetcher/material';
import { useParams } from 'next/navigation';


// Mock all the data fetching hooks
vi.mock('@/dataFetcher/deficiency', () => ({
    useDeficiencyTypes: vi.fn()
}));

vi.mock('@/dataFetcher/cadet', () => ({
    useCadetUniformDescriptList: vi.fn(),
}));

vi.mock('@/dataFetcher/material', () => ({
    useMaterialConfiguration: vi.fn(),
}));

const mockDeficiencyTypeList = [
    { id: 'type1', name: 'Uniform Issue', dependent: deficiencytype_dependent.uniform, relation: null },
    { id: 'type2', name: 'Cadet Issue', dependent: deficiencytype_dependent.cadet, relation: null },
    { id: 'type3', name: 'Material Issue', dependent: deficiencytype_dependent.cadet, relation: deficiencytype_relation.material },
    { id: 'type4', name: 'Cadet Uniform Issue', dependent: deficiencytype_dependent.cadet, relation: deficiencytype_relation.uniform }
];
const mockUniformLabels = [
    { id: 'uniform1', description: 'Jacket-1234' },
    { id: 'uniform2', description: 'Trousers-1234' }
];

const mockMaterialConfiguration = [
    {
        id: 'group1',
        description: 'Accessories',
        issuedDefault: null,
        sortOrder: 0,
        multitypeAllowed: false,
        typeList: [
            { id: 'mattype1', typename: 'Type A Group1', sortOrder: 1 },
            { id: 'mattype2', typename: 'Type B Group1', sortOrder: 2 }
        ]
    },
    {
        id: 'group2',
        description: 'Equipment',
        issuedDefault: null,
        sortOrder: 1,
        multitypeAllowed: false,
        typeList: [
            { id: 'mattype3', typename: 'Type A Group2', sortOrder: 1 },
            { id: 'mattype4', typename: 'Type B Group2', sortOrder: 2 }
        ]
    }
] satisfies MaterialGroup[];

// Test wrapper component
interface TestWrapperProps {
    children: React.ReactNode;
    defaultValues?: Partial<CadetInspectionFormSchema>;
}

const TestWrapper: React.FC<TestWrapperProps> = ({ children, defaultValues = {} }) => {
    const methods = useForm<CadetInspectionFormSchema>({
        defaultValues: {
            cadetId: 'test-cadet-id',
            uniformComplete: false,
            oldDeficiencyList: [],
            newDeficiencyList: [
                {
                    typeId: '',
                    description: '',
                    comment: '',
                    uniformId: null,
                    materialId: null,
                    dateCreated: null
                }
            ],
            ...defaultValues,
        },
    });

    return (
        <FormProvider {...methods}>
            {children}
        </FormProvider>
    );
};

const mockRemove = vi.fn();

const defaultProps = {
    index: 0,
    remove: mockRemove
};

describe('NewDeficiencyRow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useParams).mockReturnValue({ cadetId: 'test-cadet-id' });
        vi.mocked(useDeficiencyTypes).mockReturnValue({ deficiencyTypeList: mockDeficiencyTypeList });
        vi.mocked(useCadetUniformDescriptList).mockReturnValue({ uniformLabels: mockUniformLabels });
        vi.mocked(useMaterialConfiguration).mockReturnValue({ config: mockMaterialConfiguration });
    });

    describe('Basic Rendering', () => {
        it('should render all always-present elements correctly', () => {
            render(
                <TestWrapper>
                    <NewDeficiencyRow {...defaultProps} />
                </TestWrapper>
            );

            // Check type selection field is always present
            expect(screen.getByLabelText(/common.type/i)).toBeInTheDocument();
            expect(screen.getByRole('combobox', { name: /common.type/i })).toBeInTheDocument();

            // Check both delete buttons are present with correct test-ids
            expect(screen.getByTestId('btn_delete_mobile')).toBeInTheDocument();
            expect(screen.getByTestId('btn_delete')).toBeInTheDocument();

            // Check comment textarea is always present
            expect(screen.getByLabelText(/common.comment/i)).toBeInTheDocument();
            const commentField = screen.getByRole('textbox', { name: /common.comment/i });
            expect(commentField).toBeInTheDocument();

            // Verify no conditional fields are shown initially (when no type is selected)
            expect(screen.queryByLabelText(/common.description/i)).not.toBeInTheDocument();
            expect(screen.queryByLabelText(/common.uniform.item/i)).not.toBeInTheDocument();
            expect(screen.queryByLabelText(/common.material.material/i)).not.toBeInTheDocument();
        });
    });

    describe('Conditional Field Rendering', () => {
        it('should show description field for cadet deficiency with no relation', () => {
            // Mock deficiency type: cadet + null relation
            const formData = {
                newDeficiencyList: [
                    {
                        typeId: 'type2', // Cadet Issue from mock
                        description: '',
                        comment: '',
                        uniformId: null,
                        materialId: null,
                        dateCreated: null
                    }
                ]
            };

            render(
                <TestWrapper defaultValues={formData}>
                    <NewDeficiencyRow {...defaultProps} />
                </TestWrapper>
            );

            // Description field should be visible
            expect(screen.getByLabelText(/common.description/i)).toBeInTheDocument();
            const descriptionField = screen.getByRole('textbox', { name: /common.description/i });
            expect(descriptionField).toBeInTheDocument();

            // Other conditional fields should NOT be visible
            expect(screen.queryByLabelText(/common.uniform.item/i)).not.toBeInTheDocument();
            expect(screen.queryByLabelText(/common.material.material/i)).not.toBeInTheDocument();
        });

        it('should show uniform field for uniform-dependent deficiencies', () => {
            // Mock deficiency type: uniform dependent
            const formData = {
                newDeficiencyList: [
                    {
                        typeId: 'type1', // Uniform Issue from mock
                        description: '',
                        comment: '',
                        uniformId: null,
                        materialId: null,
                        dateCreated: null
                    }
                ]
            };

            render(
                <TestWrapper defaultValues={formData}>
                    <NewDeficiencyRow {...defaultProps} />
                </TestWrapper>
            );

            // Uniform field should be visible
            expect(screen.getByLabelText(/common.uniform.item/i)).toBeInTheDocument();

            // Verify uniform options are present
            expect(screen.getByRole('combobox', { name: /common.uniform.item/i })).toBeInTheDocument();

            // Other conditional fields should NOT be visible
            expect(screen.queryByLabelText(/common.description/i)).not.toBeInTheDocument();
            expect(screen.queryByLabelText(/common.material.material/i)).not.toBeInTheDocument();
        });

        it('should show uniform field for cadet deficiency with uniform relation', () => {
            const formData = {
                newDeficiencyList: [
                    {
                        typeId: 'type4', // Cadet Uniform Issue from mock
                        description: '',
                        comment: '',
                        uniformId: null,
                        materialId: null,
                        dateCreated: null
                    }
                ]
            };

            render(
                <TestWrapper defaultValues={formData}>
                    <NewDeficiencyRow {...defaultProps} />
                </TestWrapper>
            );

            // Uniform field should be visible (cadet + uniform relation)
            expect(screen.getByLabelText(/common.uniform.item/i)).toBeInTheDocument();

            // Other conditional fields should NOT be visible
            expect(screen.queryByLabelText(/common.description/i)).not.toBeInTheDocument();
            expect(screen.queryByLabelText(/common.material.material/i)).not.toBeInTheDocument();
        });

        it('should show material field for cadet deficiency with material relation', () => {
            const formData = {
                newDeficiencyList: [
                    {
                        typeId: 'type3', // Material Issue from mock
                        description: '',
                        comment: '',
                        uniformId: null,
                        materialId: null,
                        dateCreated: null
                    }
                ]
            };

            render(
                <TestWrapper defaultValues={formData}>
                    <NewDeficiencyRow {...defaultProps} />
                </TestWrapper>
            );

            // Material field should be visible
            expect(screen.getByLabelText(/common.material.material/i)).toBeInTheDocument();

            // Other conditional fields should NOT be visible
            expect(screen.queryByLabelText(/common.description/i)).not.toBeInTheDocument();
            expect(screen.queryByLabelText(/common.uniform.item/i)).not.toBeInTheDocument();
        });

        it('should hide additional material fields when material is not "others"', () => {
            const formData = {
                newDeficiencyList: [
                    {
                        typeId: 'type3', // Material Issue
                        description: '',
                        comment: '',
                        uniformId: null,
                        materialId: null,
                        dateCreated: null
                    }
                ]
            };

            render(
                <TestWrapper defaultValues={formData}>
                    <NewDeficiencyRow {...defaultProps} />
                </TestWrapper>
            );

            // Material field should be visible
            expect(screen.getByLabelText(/common.material.material/i)).toBeInTheDocument();

            // Additional material fields should NOT be visible when regular material is selected
            expect(screen.queryByLabelText(/common.material.group_one/i)).not.toBeInTheDocument();
            expect(screen.queryByLabelText(/common.material.type_one/i)).not.toBeInTheDocument();
        });

        it('should disable type field when dateCreated is present', () => {
            const formData = {
                newDeficiencyList: [
                    {
                        typeId: 'type1',
                        description: '',
                        comment: '',
                        uniformId: null,
                        materialId: null,
                        dateCreated: '2024-01-15T10:30:00Z' // dateCreated present
                    }
                ]
            };

            render(
                <TestWrapper defaultValues={formData}>
                    <NewDeficiencyRow {...defaultProps} />
                </TestWrapper>
            );

            // Type field should be disabled when dateCreated is present
            const typeField = screen.getByRole('combobox', { name: /common.type/i });
            expect(typeField).toBeDisabled();
        });
    });

    describe('options in select fields', () => {

        it('should display correct options in deficiency type select', () => {
            render(
                <TestWrapper>
                    <NewDeficiencyRow {...defaultProps} />
                </TestWrapper>
            );

            const typeSelect = screen.getByRole('combobox', { name: /common.type/i });
            expect(typeSelect).toBeInTheDocument();

            // Check if the select contains the expected options based on our mock data
            const options = getAllByRole(typeSelect, 'option');
            expect(options).toHaveLength(5); // 4 from mockDeficiencyTypeList + 1 "please select" option
            expect(options[0]).toHaveTextContent('common.error.pleaseSelect');
            expect(options[1]).toHaveTextContent('Uniform Issue');
            expect(options[2]).toHaveTextContent('Cadet Issue');
            expect(options[3]).toHaveTextContent('Material Issue');
            expect(options[4]).toHaveTextContent('Cadet Uniform Issue');
        });

        it('should display correct options in uniform select', () => {
            const formData = {
                newDeficiencyList: [
                    {
                        typeId: 'type1', // Uniform Issue
                        description: '',
                        comment: '',
                        uniformId: null,
                        materialId: null,
                        dateCreated: null
                    }
                ]
            };

            render(
                <TestWrapper defaultValues={formData}>
                    <NewDeficiencyRow {...defaultProps} />
                </TestWrapper>
            );

            const uniformSelect = screen.getByRole('combobox', { name: /common.uniform.item/i });
            expect(uniformSelect).toBeInTheDocument();

            // Check uniform options based on mockUniformLabels
            const options = getAllByRole(uniformSelect, 'option');
            expect(options).toHaveLength(3); // 2 from mockUniformLabels + 1 "please select" option
            expect(options[0]).toHaveTextContent('common.error.pleaseSelect');
            expect(options[1]).toHaveTextContent('Jacket-1234');
            expect(options[2]).toHaveTextContent('Trousers-1234');
        });

        it('should display correct options in material select', () => {
            const formData = {
                newDeficiencyList: [
                    {
                        typeId: 'type3', // Material Issue, relation: material
                        description: '',
                        comment: '',
                        uniformId: null,
                        materialId: null,
                        dateCreated: null
                    }
                ]
            };

            render(
                <TestWrapper defaultValues={formData}>
                    <NewDeficiencyRow {...defaultProps} />
                </TestWrapper>
            );

            // Material field is now an autocomplete input (not a select)
            const materialInput = screen.getByLabelText(/common.material.material/i);
            expect(materialInput).toBeInTheDocument();

            // useMaterialConfiguration should have been called to supply options
            expect(vi.mocked(useMaterialConfiguration)).toHaveBeenCalled();
        });
    });
});
