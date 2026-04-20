import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { deficiencytype_dependent, deficiencytype_relation } from '@/prisma/enums';
import { DeficiencyFormFields } from './DeficiencyFormFields';
import { useDeficiencyTypes } from '@/dataFetcher/deficiency';
import { useCadetUniformDescriptList } from '@/dataFetcher/cadet';
import { useMaterialConfiguration } from '@/dataFetcher/material';
import { MaterialGroup } from '@/types/globalMaterialTypes';
import { useParams } from 'next/navigation';

vi.mock('@/dataFetcher/deficiency', () => ({
    useDeficiencyTypes: vi.fn(),
}));

vi.mock('@/dataFetcher/cadet', () => ({
    useCadetUniformDescriptList: vi.fn(),
}));

vi.mock('@/dataFetcher/material', () => ({
    useMaterialConfiguration: vi.fn(),
}));

const mockDeficiencyTypeList = [
    { id: 'type-uniform', name: 'Uniform Issue', dependent: deficiencytype_dependent.uniform, relation: null },
    { id: 'type-cadet-none', name: 'Cadet Issue', dependent: deficiencytype_dependent.cadet, relation: null },
    { id: 'type-cadet-material', name: 'Material Issue', dependent: deficiencytype_dependent.cadet, relation: deficiencytype_relation.material },
    { id: 'type-cadet-uniform', name: 'Cadet Uniform Issue', dependent: deficiencytype_dependent.cadet, relation: deficiencytype_relation.uniform },
];

const mockUniformLabels = [
    { id: 'uniform-1', description: 'Jacket-1234' },
    { id: 'uniform-2', description: 'Trousers-1234' },
];

const mockMaterialConfig = [
    {
        id: 'group-1',
        description: 'Accessories',
        issuedDefault: null,
        sortOrder: 0,
        multitypeAllowed: false,
        typeList: [{ id: 'mattype-1', typename: 'Type A', sortOrder: 1 }],
    },
] satisfies MaterialGroup[];

const cadetId = 'test-cadet-id';

describe('DeficiencyFormFields', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useParams).mockReturnValue({ cadetId });
        vi.mocked(useDeficiencyTypes).mockReturnValue({ deficiencyTypeList: mockDeficiencyTypeList });
        vi.mocked(useCadetUniformDescriptList).mockReturnValue({ uniformLabels: mockUniformLabels });
        vi.mocked(useMaterialConfiguration).mockReturnValue({ config: mockMaterialConfig });
    });

    const renderFields = (namePrefix = '', defaultValues = {}) => {
        const methods = { current: null as any };
        const Wrapper = () => {
            const form = useForm({ defaultValues });
            methods.current = form;
            return (
                <FormProvider {...form}>
                    <div style={{ display: 'contents' }}>
                        <DeficiencyFormFields
                            namePrefix={namePrefix}
                            cadetId={cadetId}
                        />
                    </div>
                </FormProvider>
            );
        };
        render(<Wrapper />);
        return methods;
    };

    describe('Basic rendering', () => {
        it('renders type selector and comment field always', () => {
            renderFields();
            expect(screen.getByLabelText(/common.type/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/common.comment/i)).toBeInTheDocument();
        });

        it('does not render conditional fields when no type is selected', () => {
            renderFields();
            expect(screen.queryByLabelText(/common.description/i)).not.toBeInTheDocument();
            expect(screen.queryByLabelText(/common.uniform.item/i)).not.toBeInTheDocument();
            expect(screen.queryByLabelText(/common.material.material/i)).not.toBeInTheDocument();
        });

        it('disables type selector when disabled=true', () => {
            const Wrapper = () => {
                const form = useForm({ defaultValues: {} });
                return (
                    <FormProvider {...form}>
                        <DeficiencyFormFields
                            namePrefix=""
                            cadetId={cadetId}
                            typeSelectDisabled
                        />
                    </FormProvider>
                );
            };
            render(<Wrapper />);
            const typeSelect = screen.getByLabelText(/common.type/i);
            expect(typeSelect).toBeDisabled();
        });
    });

    describe('Conditional field rendering based on type', () => {
        it('shows description field when cadet type with null relation is selected', () => {
            renderFields('', { typeId: 'type-cadet-none' });
            expect(screen.getByLabelText(/common.description/i)).toBeInTheDocument();
            expect(screen.queryByLabelText(/common.uniform.item/i)).not.toBeInTheDocument();
        });

        it('shows uniform selector when uniform-dependent type is selected', () => {
            renderFields('', { typeId: 'type-uniform' });
            expect(screen.getByLabelText(/common.uniform.item/i)).toBeInTheDocument();
            expect(screen.queryByLabelText(/common.description/i)).not.toBeInTheDocument();
        });

        it('shows material selector when cadet+material type is selected', () => {
            renderFields('', { typeId: 'type-cadet-material' });
            expect(screen.getByLabelText(/common.material.material/i)).toBeInTheDocument();
            // No extended group/type selects
            expect(screen.queryByLabelText(/common.material.group_one/i)).not.toBeInTheDocument();
            expect(screen.queryByLabelText(/common.material.type_one/i)).not.toBeInTheDocument();
        });

        it('shows uniform selector when cadet+uniform-relation type is selected', () => {
            renderFields('', { typeId: 'type-cadet-uniform' });
            expect(screen.getByLabelText(/common.uniform.item/i)).toBeInTheDocument();
            expect(screen.queryByLabelText(/common.description/i)).not.toBeInTheDocument();
        });
    });

    it('only disables type selector when typeSelectDisabled is set', () => {
        const Wrapper = () => {
            const form = useForm({ defaultValues: {} });
            return (
                <FormProvider {...form}>
                    <DeficiencyFormFields
                        namePrefix=""
                        cadetId={cadetId}
                        typeSelectDisabled
                    />
                </FormProvider>
            );
        };
        render(<Wrapper />);
        const typeSelect = screen.getByLabelText(/common.type/i);
        expect(typeSelect).toBeDisabled();
        // comment textarea should not be disabled
        expect(screen.getByLabelText(/common.comment/i)).not.toBeDisabled();
    });

    describe('namePrefix support', () => {
        it('renders correctly with a prefix', () => {
            renderFields('newDeficiencyList.0', { 'newDeficiencyList.0': { typeId: '', comment: '' } });
            // Type selector should still be visible with prefixed names
            expect(screen.getByLabelText(/common.type/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/common.comment/i)).toBeInTheDocument();
        });
    });

    describe('default values', () => {
        it('initializes material selector when type with material relation is selected', () => {
            const defaultMaterialId = 'mattype-1';
            renderFields('', { typeId: 'type-cadet-material', materialId: defaultMaterialId });
            const materialSelect = screen.getByLabelText(/common.material.material/i);
            expect(materialSelect).toHaveValue("Accessories");

        });
        it('initializes description field when type with null relation is selected', () => {
            const defaultDescription = 'Pre-filled description';
            renderFields('', { typeId: 'type-cadet-none', description: defaultDescription });
            const descriptionInput = screen.getByLabelText(/common.description/i);
            expect(descriptionInput).toHaveValue(defaultDescription);
        });
        it('initializes uniform selector when type with uniform dependency is selected', () => {
            const defaultUniformId = 'uniform-1';
            renderFields('', { typeId: 'type-uniform', uniformId: defaultUniformId });
            const uniformSelect = screen.getByLabelText(/common.uniform.item/i);
            expect(uniformSelect).toHaveValue(defaultUniformId);
        });
        it('initializes uniform selector when type with uniform relation is selected', () => {
            const defaultUniformId = 'uniform-2';
            renderFields('', { typeId: 'type-cadet-uniform', uniformId: defaultUniformId });
            const uniformSelect = screen.getByLabelText(/common.uniform.item/i);
            expect(uniformSelect).toHaveValue(defaultUniformId);
        });
    })
});
