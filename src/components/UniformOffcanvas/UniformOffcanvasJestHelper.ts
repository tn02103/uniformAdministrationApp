import { Deficiency } from "@/types/deficiencyTypes";
import { generationLists, sizeLists, typeList } from "../../../tests/_jestConfig/staticMockData";
import { AuthRole } from "@/lib/AuthRoles";


// ------------- MOCKS FOR DEFICIENCY -------------
jest.mock('@/dal/inspection/deficiency', () => ({
    createUniformDeficiency: jest.fn(async () => "created successfully"),
    resolveDeficiency: jest.fn(async () => "resolved successfully"),
    updateUniformDeficiency: jest.fn(async () => "updated successfully"),
}));

jest.mock('@/dataFetcher/deficiency', () => ({
    useDeficienciesByUniformId: jest.fn((_, includeResolved) => {
        if (includeResolved) {
            return { deficiencies: mockDeficiencyList };
        } else {
            return { deficiencies: mockDeficiencyList.slice(0, 2) };
        }
    }),
    useDeficiencyTypes: jest.fn(() => ({ deficiencyTypeList: mockDeficiencyTypeList })),
}));

// ------------- MOCKS FOR UNIFORM -------------

jest.mock('@/dataFetcher/uniformAdmin', () => ({
    useUniformGenerationListByType: jest.fn(() => ({
        generationList: generationLists[0]
    })),
    useUniformTypeList: jest.fn(() => ({
        typeList
    })),
}));
jest.mock("@/dal/uniform/item/_index", () => ({
    updateUniformItem: jest.fn(() => Promise.resolve('Saved item')),
    deleteUniformItem: jest.fn(() => Promise.resolve('Deleted item')),
    getUniformItemHistory: jest.fn(() => Promise.resolve([])), // Mock for history
    getUniformItemCountByType: jest.fn(() => Promise.resolve(0)), // Mock for count
    issueUniformItem: jest.fn(),
    createUniformItems: jest.fn(),
    getUniformItemDeficiencies: jest.fn(),
}));
jest.mock('../globalDataProvider', () => ({
    useGlobalData: jest.fn(() => ({
        sizelists: sizeLists,
        userRole: global.__ROLE__ ?? AuthRole.admin,
    })),
}));
jest.mock('@/dataFetcher/uniform', () => ({
    useUniformItemHistory: jest.fn(() => ({
        history: mockUniformHistory,
    })),
}));

// ------------- OTHER MOCKS -------------
jest.mock("swr", () => ({
    mutate: jest.fn(async () => { }),
}));

jest.mock('react-toastify', () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn(),
    },
}));

export const mockDeficiencyTypeList = [
    {
        id: 'de3860d4-c88e-4a7c-be4c-7e832eda31d4',
        name: 'Test Type',
        dependent: 'uniform',
    },
    {
        id: '61d28738-4757-4e98-bfbf-a82f8404a74a',
        name: 'Another One',
        dependent: 'uniform',
    },
];
export const mockDeficiencyList: Deficiency[] = [
    {
        id: '80c36a66-81e9-4c9c-8d56-a095a6e9e28b',
        comment: 'Test comment',
        description: 'Test description',
        dateCreated: new Date('2023-10-01T12:00:00Z'),
        dateUpdated: new Date('2023-10-01T12:00:00Z'),
        userCreated: 'user',
        userUpdated: 'user',
        typeId: mockDeficiencyTypeList[0].id,
        typeName: mockDeficiencyTypeList[0].name,
    },
    {
        id: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
        comment: 'Test comment 2',
        description: 'Test description 2',
        dateCreated: new Date('2023-10-02T12:00:00Z'),
        dateUpdated: new Date('2023-10-12T12:00:00Z'),
        userCreated: 'user',
        userUpdated: 'user1',
        typeId: mockDeficiencyTypeList[1].id,
        typeName: mockDeficiencyTypeList[1].name,
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
        typeId: mockDeficiencyTypeList[0].id,
        typeName: mockDeficiencyTypeList[0].name,
    },
];
export const mockUniform = {
    id: "c227ac23-93d4-42b5-be2e-956ea35c2db9",
    number: 2501,
    generation: generationLists[0][1],
    size: sizeLists[0].uniformSizes[0],
    comment: "Test comment",
    active: true,
    type: {
        id: typeList[0].id,
        name: typeList[0].name,
    },
};
export const mockUniformHistory = [
    {
        dateIssued: new Date('2023-10-01T12:00:00Z'),
        dateReturned: null,
        cadet: {
            firstname: 'John',
            lastname: 'Doe',
            recdelete: false,
        },
    },
    {
        dateIssued: new Date('2023-10-02T12:00:00Z'),
        dateReturned: new Date('2023-10-03T12:00:00Z'),
        cadet: {
            firstname: 'Jane',
            lastname: 'Smith',
            recdelete: true,
        },
    },
];