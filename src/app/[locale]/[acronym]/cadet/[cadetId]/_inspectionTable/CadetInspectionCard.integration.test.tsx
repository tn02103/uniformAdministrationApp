import * as dalInspection from '@/dal/inspection';
import * as dalDeficiency from '@/dal/inspection/deficiency';
import * as dataFetcherCadet from '@/dataFetcher/cadet';
import * as dataFetcherDeficiency from '@/dataFetcher/deficiency';
import * as dataFetcherInspection from '@/dataFetcher/inspection';
import * as dataFetcherMaterial from '@/dataFetcher/material';
import { deficiencytype_dependent } from '@/prisma/enums';
import { MaterialGroup } from '@/types/globalMaterialTypes';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as nextNavigation from 'next/navigation';
import * as swr from 'swr';
import { CadetInspectionCard } from './CadetInspectionCard';

vi.mock('@/dal/inspection', () => ({
    getCadetInspectionFormData: vi.fn(),
    saveCadetInspection: vi.fn(),
}));

vi.mock('@/dal/inspection/deficiency', () => ({
    createDeficiency: vi.fn(),
    updateDeficiency: vi.fn(),
    resolveDeficiency: vi.fn(),
}));

vi.mock('@/dataFetcher/inspection', () => ({
    useUnresolvedDeficienciesByCadet: vi.fn(),
    useInspectionState: vi.fn(),
    useInspectedCadetIdList: vi.fn(),
}));

vi.mock('@/dataFetcher/deficiency', () => ({
    useDeficiencyTypes: vi.fn(),
}));

vi.mock('@/dataFetcher/cadet', () => ({
    useCadetUniformDescriptList: vi.fn(),
    useCadetUniformComplete: vi.fn(),
}));

vi.mock('@/dataFetcher/material', () => ({
    useMaterialConfiguration: vi.fn(),
}));

vi.mock('swr', async (importOriginal) => {
    const actual = await importOriginal() as Record<string, unknown>;
    return { ...actual, mutate: vi.fn() };
});

// Use valid UUIDs so Zod validation passes
const mockCadetId = '59b34bbe-8c80-477c-93de-43eed2258051';
const mockCadetTypeId = 'b2a9f3e8-c1d2-4e5f-8091-a2b3c4d5e6f7';

const mockDeficiencyTypeList = [
    { id: mockCadetTypeId, name: 'Cadet Issue', dependent: deficiencytype_dependent.cadet, relation: null },
];

const mockMaterialConfig: MaterialGroup[] = [];

const mockUnresolvedDeficiencies = [
    {
        id: 'c023d77a-4175-4d5d-b202-5defec4ebc7c',
        typeId: mockCadetTypeId,
        description: 'Missing button',
        typeName: 'Cadet Issue',
        comment: 'Left chest button',
        dateCreated: new Date('2024-01-15'),
    },
];

const mockFormData = {
    cadetId: mockCadetId,
    uniformComplete: true,
    oldDeficiencyList: [
        {
            id: 'c023d77a-4175-4d5d-b202-5defec4ebc7c',
            typeId: mockCadetTypeId,
            typeName: 'Cadet Issue',
            description: 'Missing button',
            comment: 'Left chest button',
            dateCreated: new Date('2024-01-15'),
            resolved: false,
        },
    ],
    newDeficiencyList: [],
};

const mockFormDataNoOldDefs = {
    cadetId: mockCadetId,
    uniformComplete: true,
    oldDeficiencyList: [],
    newDeficiencyList: [],
};

describe('CadetInspectionCard - no active inspection', () => {
    const user = userEvent.setup();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(nextNavigation.useParams).mockReturnValue({ cadetId: mockCadetId });
        vi.mocked(dataFetcherInspection.useUnresolvedDeficienciesByCadet).mockReturnValue({
            unresolvedDeficiencies: mockUnresolvedDeficiencies,
        });
        vi.mocked(dataFetcherInspection.useInspectionState).mockReturnValue({
            inspectionState: { active: false, state: 'none' },
        });
        vi.mocked(dataFetcherInspection.useInspectedCadetIdList).mockReturnValue({ inspectedIdList: [] });
        vi.mocked(dataFetcherDeficiency.useDeficiencyTypes).mockReturnValue({ deficiencyTypeList: mockDeficiencyTypeList });
        vi.mocked(dataFetcherCadet.useCadetUniformDescriptList).mockReturnValue({ uniformLabels: [] });
        vi.mocked(dataFetcherCadet.useCadetUniformComplete).mockReturnValue(true);
        vi.mocked(dataFetcherMaterial.useMaterialConfiguration).mockReturnValue({ config: mockMaterialConfig });
        vi.mocked(dalDeficiency.createDeficiency).mockResolvedValue(undefined);
        vi.mocked(dalDeficiency.updateDeficiency).mockResolvedValue(undefined);
        vi.mocked(swr.mutate).mockResolvedValue(undefined);
    });

    it('can show the create deficiency form', async () => {
        render(<CadetInspectionCard />);

        const createButton = screen.getByTestId('btn_new_deficiency');
        expect(createButton).not.toBeDisabled();

        await user.click(createButton);

        expect(screen.getByTestId('btn_save_new_deficiency')).toBeInTheDocument();
        expect(screen.getByTestId('btn_cancel_new_deficiency')).toBeInTheDocument();
        expect(screen.getByTestId('btn_new_deficiency')).toBeDisabled();
    });

    it('can cancel creating a deficiency', async () => {
        render(<CadetInspectionCard />);

        await user.click(screen.getByTestId('btn_new_deficiency'));
        expect(screen.getByTestId('btn_save_new_deficiency')).toBeInTheDocument();

        await user.click(screen.getByTestId('btn_cancel_new_deficiency'));
        expect(screen.queryByTestId('btn_save_new_deficiency')).not.toBeInTheDocument();
    });

    it('can save a new deficiency', async () => {
        render(<CadetInspectionCard />);

        await user.click(screen.getByTestId('btn_new_deficiency'));

        // Select the deficiency type
        const typeSelect = screen.getByRole('combobox', { name: /common.type/i });
        await user.selectOptions(typeSelect, mockCadetTypeId);

        // Fill in description (required for cadet type with null relation)
        const descInput = await screen.findByRole('textbox', { name: /common.description/i });
        await user.type(descInput, 'Test description');

        // Fill in comment
        const commentInput = screen.getByRole('textbox', { name: /common.comment/i });
        await user.type(commentInput, 'Test comment');

        await user.click(screen.getByTestId('btn_save_new_deficiency'));

        await waitFor(() => {
            expect(vi.mocked(dalDeficiency.createDeficiency)).toHaveBeenCalled();
        });
        await waitFor(() => {
            expect(vi.mocked(swr.mutate)).toHaveBeenCalled();
        });
        await waitFor(() => {
            expect(screen.queryByTestId('btn_save_new_deficiency')).not.toBeInTheDocument();
        });
    });

    it('can edit a deficiency', async () => {
        render(<CadetInspectionCard />);

        const defId = mockUnresolvedDeficiencies[0].id;
        await user.click(screen.getByTestId(`btn_edit_${defId}`));

        // Edit form appears with description and comment inputs
        const descInput = screen.getByRole('textbox', { name: /common.description/i });
        await user.clear(descInput);
        await user.type(descInput, 'Updated Description');

        const commentInput = screen.getByRole('textbox', { name: /common.comment/i });
        await user.clear(commentInput);
        await user.type(commentInput, 'Updated Comment');

        await user.click(screen.getByTestId(`btn_save_edit_${defId}`));

        await waitFor(() => {
            expect(vi.mocked(dalDeficiency.updateDeficiency)).toHaveBeenCalled();
        });
        await waitFor(() => {
            expect(vi.mocked(swr.mutate)).toHaveBeenCalled();
        });
    });
});

describe('CadetInspectionCard - active inspection', () => {
    const user = userEvent.setup();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(nextNavigation.useParams).mockReturnValue({ cadetId: mockCadetId });
        vi.mocked(dataFetcherInspection.useUnresolvedDeficienciesByCadet).mockReturnValue({
            unresolvedDeficiencies: mockUnresolvedDeficiencies,
        });
        vi.mocked(dataFetcherInspection.useInspectionState).mockReturnValue({
            inspectionState: { active: true, state: 'active', id: 'insp-1', date: '2026-01-01', inspectedCadets: 0, activeCadets: 10, deregistrations: 0 },
        });
        vi.mocked(dataFetcherInspection.useInspectedCadetIdList).mockReturnValue({ inspectedIdList: [] });
        vi.mocked(dataFetcherDeficiency.useDeficiencyTypes).mockReturnValue({ deficiencyTypeList: mockDeficiencyTypeList });
        vi.mocked(dataFetcherCadet.useCadetUniformDescriptList).mockReturnValue({ uniformLabels: [] });
        vi.mocked(dataFetcherCadet.useCadetUniformComplete).mockReturnValue(true);
        vi.mocked(dataFetcherMaterial.useMaterialConfiguration).mockReturnValue({ config: mockMaterialConfig });
        vi.mocked(dalInspection.getCadetInspectionFormData).mockResolvedValue(mockFormData);
        vi.mocked(dalInspection.saveCadetInspection).mockResolvedValue(undefined);
        vi.mocked(swr.mutate).mockResolvedValue(undefined);
    });

    it('starts inspection and shows step 1', async () => {
        render(<CadetInspectionCard />);

        await user.click(screen.getByTestId('btn_inspect'));

        await waitFor(() => {
            expect(vi.mocked(dalInspection.getCadetInspectionFormData)).toHaveBeenCalledWith(mockCadetId);
        });

        // With old deficiencies, step 1 is shown
        expect(await screen.findByTestId('btn_step1_continue')).toBeInTheDocument();
        expect(screen.getByTestId('btn_step1_back')).toBeInTheDocument();
    });

    it('can navigate between steps', async () => {
        render(<CadetInspectionCard />);

        await user.click(screen.getByTestId('btn_inspect'));
        await screen.findByTestId('btn_step1_continue');

        // Navigate to step 2
        await user.click(screen.getByTestId('btn_step1_continue'));
        expect(await screen.findByTestId('btn_step2_submit')).toBeInTheDocument();

        // Navigate back to step 1
        await user.click(screen.getByTestId('btn_step2_back'));
        expect(await screen.findByTestId('btn_step1_continue')).toBeInTheDocument();
    });

    it('can save inspection', async () => {
        // No old deficiencies → goes directly to step 2
        vi.mocked(dalInspection.getCadetInspectionFormData).mockResolvedValue(mockFormDataNoOldDefs);

        render(<CadetInspectionCard />);

        await user.click(screen.getByTestId('btn_inspect'));
        await screen.findByTestId('btn_step2_submit');

        await user.click(screen.getByTestId('btn_step2_submit'));

        await waitFor(() => {
            expect(vi.mocked(dalInspection.saveCadetInspection)).toHaveBeenCalled();
        });
        await waitFor(() => {
            expect(vi.mocked(swr.mutate)).toHaveBeenCalled();
        });
        // Back to step 0 — submit button is gone
        await waitFor(() => {
            expect(screen.queryByTestId('btn_step2_submit')).not.toBeInTheDocument();
        });
    });
});
