import { fireEvent, render, screen } from "@testing-library/react";
import { UniformDeficiencyRow } from "./UniformDeficiencyRow";
import { Deficiency } from "@/types/deficiencyTypes";
import de from "../../../public/locales/de";
import userEvent from "@testing-library/user-event";
import { exportForTesting } from "./UniformDeficiencyRow";

const uniformId = '079379db-8510-4c9a-b549-15d80d29aca5';
const deficiencyTypeList = [
    {
        id: 'de3860d4-c88e-4a7c-be4c-7e832eda31d4',
        name: 'Test Type',
        dependent: 'uniform',
    },
    {
        id: '61d28738-4757-4e98-bfbf-a82f8404a74a',
        name: 'Test Type 2',
        dependent: 'uniform',
    },
];
const deficiencies: Deficiency[] = [
    {
        id: '80c36a66-81e9-4c9c-8d56-a095a6e9e28b',
        comment: 'Test comment',
        description: 'Test description',
        dateCreated: new Date('2023-10-01T12:00:00Z'),
        dateUpdated: new Date('2023-10-01T12:00:00Z'),
        userCreated: 'user',
        userUpdated: 'user',
        typeId: deficiencyTypeList[0].id,
        typeName: deficiencyTypeList[0].name,
    },
    {
        id: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
        comment: 'Test comment 2',
        description: 'Test description 2',
        dateCreated: new Date('2023-10-02T12:00:00Z'),
        dateUpdated: new Date('2023-10-12T12:00:00Z'),
        userCreated: 'user',
        userUpdated: 'user1',
        typeId: deficiencyTypeList[1].id,
        typeName: deficiencyTypeList[1].name,
    },
    {
        id: 'b7c8d9e0-f1g2-h3i4-j5k6-l7m8n9o0p1q2',
        comment: 'Test comment 3',
        description: 'Test description 3',
        dateCreated: new Date('2023-10-03T12:00:00Z'),
        dateUpdated: new Date('2023-10-12T12:00:00Z'),
        dateResolved: new Date('2023-10-17T12:00:00Z'),
        userCreated: 'user',
        userUpdated: 'user1',
        userResolved: 'user2',
        typeId: deficiencyTypeList[0].id,
        typeName: deficiencyTypeList[0].name,
    },
]

jest.mock('@/dal/inspection/deficiency', () => {
    return {
        createUniformDeficiency: jest.fn(async () => "created successfully"),
        resolveDeficiency: jest.fn(async () => "resolved successfully"),
        updateUniformDeficiency: jest.fn(async () => "updated successfully"),
    }
});
jest.mock('@/dataFetcher/deficiency', () => {
    return {
        useDeficienciesByUniformId: jest.fn((uniformId, includeResovled) => {
            if (includeResovled) {
                return deficiencies;
            } else {
                return deficiencies.filter(def => !def.dateResolved);
            }
        }),
        useDeficiencyTypes: jest.fn(() => deficiencyTypeList),
    };
});


describe('UniformDeficiencyRow', () => {
    const { } = jest.requireMock('@/dal/inspection/deficiency');
    const { useDeficienciesByUniformId } = jest.requireMock('@/dataFetcher/deficiency');

    it('renders correctly', () => {
        const { container } = render(
            <UniformDeficiencyRow
                uniformId={uniformId}
            />
        );
        expect(container).toMatchSnapshot();
    });

    it('only shows resolved deficiencies when includeResolved is true', async () => {
        const user = userEvent.setup();
        const { } = render(
            <UniformDeficiencyRow
                uniformId={uniformId}
            />
        );

        const showResolvedToggle = screen.getByRole('screen', { name: 'uniformOffcanvas.deficiency.includeResolved' });
        expect(showResolvedToggle).not.toBeChecked();
        expect(useDeficienciesByUniformId).toHaveBeenCalledTimes(1);
        expect(useDeficienciesByUniformId).toHaveBeenCalledWith(uniformId, false);
        expect(screen.getAllByRole('listitem')).toHaveLength(2);

        await user.click(showResolvedToggle);
        expect(showResolvedToggle).toBeChecked();
        expect(useDeficienciesByUniformId).toHaveBeenCalledTimes(2);
        expect(useDeficienciesByUniformId).toHaveBeenLastCalledWith(uniformId, true);
        expect(screen.getAllByRole('listitem')).toHaveLength(3);

        await user.click(showResolvedToggle);
        expect(showResolvedToggle).not.toBeChecked();
        expect(useDeficienciesByUniformId).toHaveBeenCalledTimes(3);
        expect(useDeficienciesByUniformId).toHaveBeenLastCalledWith(uniformId, false);
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    it('shows row for creating a new deficiency', async() => {
        const user = userEvent.setup();
        render(
            <UniformDeficiencyRow
                uniformId={uniformId}
            />
        );

        const createButton = screen.getByRole('button', { name: 'common.action.create' });
        await user.click(createButton);
    });
});