import React from 'react';
import { getAllByRole, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { useParams } from 'next/navigation';
import { NewDeficiencyRow } from './NewDeficiencyRow';
import { CadetInspectionFormSchema } from '@/zod/deficiency';
import { MaterialGroup } from '@/types/globalMaterialTypes';
import userEvent from '@testing-library/user-event';

// Mock all the data fetching hooks
jest.mock('@/dataFetcher/deficiency', jest.fn(() => ({
    useDeficiencyTypes: jest.fn()
})));

jest.mock('@/dataFetcher/cadet', jest.fn(() => ({
    useCadetUniformDescriptList: jest.fn(),
    useCadetMaterialDescriptionList: jest.fn()
})));

jest.mock('@/dataFetcher/material', jest.fn(() => ({
    useMaterialConfiguration: jest.fn(),
    useMaterialTypeList: jest.fn()
})));

const mockDeficiencyTypeList = [
    { id: 'type1', name: 'Uniform Issue', dependent: 'uniform', relation: null },
    { id: 'type2', name: 'Cadet Issue', dependent: 'cadet', relation: null },
    { id: 'type3', name: 'Material Issue', dependent: 'cadet', relation: 'material' },
    { id: 'type4', name: 'Cadet Uniform Issue', dependent: 'cadet', relation: 'uniform' }
];
const mockUniformLabels = [
    { id: 'uniform1', description: 'Jacket-1234' },
    { id: 'uniform2', description: 'Trousers-1234' }
];
const mockMaterialList = [
    { id: 'material1', description: 'Boots' },
    { id: 'material2', description: 'Belt' }
];
const mockMaterialConfiguration = [
    {
        id: 'group1',
        description: 'Accessories',
        typeList: [
            { id: 'mattype1', typename: 'Type A Group1', sortOrder: 1 },
            { id: 'mattype2', typename: 'Type B Group1', sortOrder: 2 }
        ]
    },
    {
        id: 'group2',
        description: 'Equipment',
        typeList: [
            { id: 'mattype3', typename: 'Type A Group2', sortOrder: 1 },
            { id: 'mattype4', typename: 'Type B Group2', sortOrder: 2 }
        ]
    }
] satisfies Partial<MaterialGroup>[];

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
                    otherMaterialGroupId: null,
                    otherMaterialId: null,
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

const mockRemove = jest.fn();

const defaultProps = {
    index: 0,
    remove: mockRemove
};

describe('NewDeficiencyRow', () => {
    const { useDeficiencyTypes } = jest.requireMock('@/dataFetcher/deficiency');
    const { useCadetUniformDescriptList, useCadetMaterialDescriptionList } = jest.requireMock('@/dataFetcher/cadet');
    const { useMaterialConfiguration, useMaterialTypeList } = jest.requireMock('@/dataFetcher/material');

    beforeEach(() => {
        jest.clearAllMocks();
        (useParams as jest.Mock).mockReturnValue({ cadetId: 'test-cadet-id' });
        useDeficiencyTypes.mockReturnValue({ deficiencyTypeList: mockDeficiencyTypeList });
        useCadetUniformDescriptList.mockReturnValue({ uniformLabels: mockUniformLabels });
        useCadetMaterialDescriptionList.mockReturnValue({ materialList: mockMaterialList });
        useMaterialConfiguration.mockReturnValue({ config: mockMaterialConfiguration });

        // Mock useMaterialTypeList to return different data based on groupId
        useMaterialTypeList.mockImplementation((groupId?: string) => {
            const group = mockMaterialConfiguration.find((g) => g.id === groupId);
            return group ? group.typeList : [];
        });
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
                        otherMaterialGroupId: null,
                        otherMaterialId: null,
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
                        otherMaterialGroupId: null,
                        otherMaterialId: null,
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
                        otherMaterialGroupId: null,
                        otherMaterialId: null,
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
                        otherMaterialGroupId: null,
                        otherMaterialId: null,
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

        it('should show additional material fields when "other" is selected', () => {
            const formData = {
                newDeficiencyList: [
                    {
                        typeId: 'type3', // Material Issue
                        description: '',
                        comment: '',
                        uniformId: null,
                        materialId: 'other', // "other" selected
                        otherMaterialGroupId: null,
                        otherMaterialId: null,
                        dateCreated: "2023-01-01"
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

            // Additional material fields should be visible when "others" is selected
            expect(screen.getByLabelText(/common.material.group_one/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/common.material.type_one/i)).toBeInTheDocument();
        });

        it('should hide additional material fields when material is not "others"', () => {
            const formData = {
                newDeficiencyList: [
                    {
                        typeId: 'type3', // Material Issue
                        description: '',
                        comment: '',
                        uniformId: null,
                        materialId: 'material1', // Regular material, not "others"
                        otherMaterialGroupId: null,
                        otherMaterialId: null,
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
                        otherMaterialGroupId: null,
                        otherMaterialId: null,
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
                        otherMaterialGroupId: null,
                        otherMaterialId: null,
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
                        typeId: 'type3', // Material Issue
                        description: '',
                        comment: '',
                        uniformId: null,
                        materialId: null,
                        otherMaterialGroupId: null,
                        otherMaterialId: null,
                        dateCreated: null
                    }
                ]
            };

            render(
                <TestWrapper defaultValues={formData}>
                    <NewDeficiencyRow {...defaultProps} />
                </TestWrapper>
            );

            const materialSelect = screen.getByRole('combobox', { name: /common.material.material/i });
            expect(materialSelect).toBeInTheDocument();

            // Material select should contain options from mockMaterialList plus "other" option
            const options = getAllByRole(materialSelect, 'option');
            expect(options).toHaveLength(4); // 2 from mockMaterialList + 1 "other" + 1 "please select" option
            expect(options[0]).toHaveTextContent('common.error.pleaseSelect');
            expect(options[1]).toHaveTextContent('Boots');
            expect(options[2]).toHaveTextContent('Belt');
            expect(options[3]).toHaveTextContent(/label.otherMaterials/i);
        });

        it('should have material select show "other" when materialId is set to "other"', () => {
            const formData = {
                newDeficiencyList: [
                    {
                        typeId: 'type3', // Material Issue
                        description: '',
                        comment: '',
                        uniformId: null,
                        materialId: 'other', // "other" selected
                        otherMaterialGroupId: null,
                        otherMaterialId: null,
                        dateCreated: "2024-01-01"
                    }
                ]
            } satisfies Partial<CadetInspectionFormSchema>;

            render(
                <TestWrapper defaultValues={formData}>
                    <NewDeficiencyRow {...defaultProps} />
                </TestWrapper>
            );

            // Check if material select shows "other" as selected
            const materialSelect = screen.getByRole('combobox', { name: /common.material.material/i });
            expect(materialSelect).toBeInTheDocument();
            expect(materialSelect).toHaveValue('other');

            // Check if material group select appears (it should based on component logic)
            const materialGroupSelect = screen.getByRole('combobox', { name: /common.material.group_one/i });
            const groupOptions = getAllByRole(materialGroupSelect, 'option');
            expect(groupOptions).toHaveLength(3);
            expect(groupOptions[0]).toHaveTextContent('common.error.pleaseSelect');
            expect(groupOptions[1]).toHaveTextContent(mockMaterialConfiguration[0].description); // Group 1
            expect(groupOptions[2]).toHaveTextContent(mockMaterialConfiguration[1].description); // Group 2

            expect(materialGroupSelect).toHaveValue("");
        });

        it('should display correct options in material type select based on selected group', async () => {
            // Create a custom test wrapper that properly sets both materialId and otherMaterialGroupId
            const CustomTestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
                const methods = useForm<CadetInspectionFormSchema>({
                    defaultValues: {
                        cadetId: 'test-cadet-id',
                        uniformComplete: false,
                        oldDeficiencyList: [],
                        newDeficiencyList: [
                            {
                                typeId: 'type3', // Material Issue
                                description: '',
                                comment: '',
                                uniformId: null,
                                materialId: 'other',
                                otherMaterialGroupId: mockMaterialConfiguration[0].id, // Group selected
                                otherMaterialId: null,
                                dateCreated: "2023-01-01"
                            }
                        ],
                    },
                });

                return (
                    <FormProvider {...methods}>
                        {children}
                    </FormProvider>
                );
            };

            render(
                <CustomTestWrapper>
                    <NewDeficiencyRow {...defaultProps} />
                </CustomTestWrapper>
            );

            // Wait for the component to render with the material type select
            const materialTypeSelect = await screen.findByRole('combobox', { name: /common.material.type_one/i });
            expect(materialTypeSelect).toBeInTheDocument();

            // Material type select should contain options from mockMaterialTypeListGroup1
            const options = getAllByRole(materialTypeSelect, 'option');
            expect(options).toHaveLength(3); // 2 from mockMaterialTypeListGroup1 + 1 "please select" option
            expect(options[0]).toHaveTextContent('common.error.pleaseSelect');
            expect(options[1]).toHaveTextContent(mockMaterialConfiguration[0].typeList[0].typename); // Type A Group1
            expect(options[2]).toHaveTextContent(mockMaterialConfiguration[0].typeList[1].typename); // Type B Group1
        });

        it('should update material type options when material group selection changes', async () => {
            // Test with group1 first
            const TestWrapperGroup1: React.FC<{ children: React.ReactNode }> = ({ children }) => {
                const methods = useForm<CadetInspectionFormSchema>({
                    defaultValues: {
                        cadetId: 'test-cadet-id',
                        uniformComplete: false,
                        oldDeficiencyList: [],
                        newDeficiencyList: [
                            {
                                typeId: 'type3',
                                description: '',
                                comment: '',
                                uniformId: null,
                                materialId: 'other',
                                otherMaterialGroupId: null,
                                otherMaterialId: null,
                                dateCreated: "2023-01-01"
                            }
                        ],
                    },
                });

                return (
                    <FormProvider {...methods}>
                        {children}
                    </FormProvider>
                );
            };

            const user = userEvent.setup();
            render(
                <TestWrapperGroup1>
                    <NewDeficiencyRow {...defaultProps} />
                </TestWrapperGroup1>
            );

            // Verify initial state with group1 options
            const materialGroupSelect = await screen.findByRole('combobox', { name: /common.material.group_one/i });
            const materialTypeSelect = await screen.findByRole('combobox', { name: /common.material.type_one/i });
            expect(materialGroupSelect).toBeInTheDocument();
            expect(materialTypeSelect).toBeInTheDocument();

            expect(materialGroupSelect).toHaveValue("");
            expect(materialTypeSelect).toHaveValue("");

            const matOption1 = getAllByRole(materialTypeSelect, 'option');
            expect(matOption1).toHaveLength(1);
            expect(matOption1[0]).toHaveTextContent('common.error.pleaseSelect');

            // select Group1 and verify type options
            await user.selectOptions(materialGroupSelect, mockMaterialConfiguration[0].id);
            const matOptions2 = getAllByRole(materialTypeSelect, 'option');
            expect(matOptions2).toHaveLength(3); // 2 from group1 + 1 "please select"
            expect(matOptions2[0]).toHaveTextContent('common.error.pleaseSelect');
            expect(matOptions2[1]).toHaveTextContent(mockMaterialConfiguration[0].typeList[0].typename); // Type A Group1
            expect(matOptions2[2]).toHaveTextContent(mockMaterialConfiguration[0].typeList[1].typename); // Type B Group1

            // select type 2
            await user.selectOptions(materialTypeSelect, mockMaterialConfiguration[0].typeList[1].id);
            expect(materialTypeSelect).toHaveValue(mockMaterialConfiguration[0].typeList[1].id);

            // change Group to Group2
            await user.selectOptions(materialGroupSelect, mockMaterialConfiguration[1].id);
            expect(materialGroupSelect).toHaveValue(mockMaterialConfiguration[1].id);

            // verify type is reset
            expect(materialTypeSelect).toHaveValue("");

            // verify type options are changed
            const matOption3 = getAllByRole(materialTypeSelect, 'option');
            expect(matOption3).toHaveLength(3);
            expect(matOption3[0]).toHaveTextContent('common.error.pleaseSelect');
            expect(matOption3[1]).toHaveTextContent(mockMaterialConfiguration[1].typeList[0].typename); // Type A Group2
            expect(matOption3[2]).toHaveTextContent(mockMaterialConfiguration[1].typeList[1].typename); // Type B Group2

        });

        it('should disable material type select when no material group is selected', () => {
            const formData = {
                newDeficiencyList: [
                    {
                        typeId: 'type3',
                        description: '',
                        comment: '',
                        uniformId: null,
                        materialId: 'other',
                        otherMaterialGroupId: null, // No group selected
                        otherMaterialId: null,
                        dateCreated: "2023-01-01"
                    }
                ]
            };

            render(
                <TestWrapper defaultValues={formData}>
                    <NewDeficiencyRow {...defaultProps} />
                </TestWrapper>
            );

            // Material type select should not be present when no group is selected
            const materialTypeSelect = screen.queryByRole('combobox', { name: /common.material.type_one/i });
            expect(materialTypeSelect).toBeDisabled();
        });
    });
});
