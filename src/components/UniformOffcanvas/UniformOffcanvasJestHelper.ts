import { Deficiency } from "@/types/deficiencyTypes";
import { mockGenerationLists, mockSizeLists, mockTypeList } from "../../../vitest/staticMockData";
import { AuthRole } from "@/lib/AuthRoles";
import { UniformHistroyEntry, UniformWithOwner } from "@/types/globalUniformTypes";

// ------------- MOCKS FOR DEFICIENCY -------------
vi.mock('@/dal/inspection/deficiency', () => ({
    createUniformDeficiency: vi.fn(async () => "created successfully"),
    resolveDeficiency: vi.fn(async () => "resolved successfully"),
    updateUniformDeficiency: vi.fn(async () => "updated successfully"),
}));

vi.mock('@/dataFetcher/deficiency', () => ({
    useDeficienciesByUniformId: vi.fn((_, includeResolved) => {
        if (includeResolved) {
            return { deficiencies: mockDeficiencyList };
        } else {
            return { deficiencies: mockDeficiencyList.slice(0, 2) };
        }
    }),
    useDeficiencyTypes: vi.fn(() => ({ deficiencyTypeList: mockDeficiencyTypeList })),
}));

// ------------- MOCKS FOR UNIFORM -------------

vi.mock('@/dataFetcher/uniformAdmin', () => ({
    useUniformGenerationListByType: vi.fn(() => ({
        generationList: mockGenerationLists[0]
    })),
    useUniformTypeList: vi.fn(() => ({
        typeList: mockTypeList
    })),
}));
vi.mock("@/dal/uniform/item/_index", () => ({
    updateUniformItem: vi.fn(() => Promise.resolve('Saved item')),
    deleteUniformItem: vi.fn(() => Promise.resolve('Deleted item')),
    issueUniformItem: vi.fn(),
    createUniformItems: vi.fn(),
    getUniformItemDeficiencies: vi.fn(),
}));
vi.mock('../globalDataProvider', () => ({
    useGlobalData: vi.fn(() => ({
        sizelists: mockSizeLists,
        userRole: global.__ROLE__ ?? AuthRole.admin,
    })),
}));
vi.mock('@/dataFetcher/uniform', () => ({
    useUniformItemHistory: vi.fn(() => ({
        history: mockUniformHistory,
    })),
}));

// ------------- STORAGE UNIT MOCKS -------------
vi.mock("@/dataFetcher/storage", () => ({
    useStorageUnitsWithUniformItemList: () => ({
        storageUnits: mockStorageUnits,
    }),
}));

vi.mock("@/dal/storageUnit/_index", () => ({
    addUniformItemToStorageUnit: vi.fn(() => Promise.resolve()),
    removeUniformFromStorageUnit: vi.fn(() => Promise.resolve()),
}));

// ------------- OTHER MOCKS -------------
vi.mock("swr", () => ({
    mutate: vi.fn(async () => { }),
}));

vi.mock('react-toastify', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));
vi.mock("next/navigation", () => ({
    usePathname: () => "/de/app/uniform/list/81ff8e9b-a097-4879-a0b2-352e54d41e6c",
}));

export const mockStorageUnits = [
    { id: "su1", name: "Kiste 01", description: "Desc 1", capacity: 2, uniformList: [], isReserve: false },
    { id: "su2", name: "Kiste 02", description: "Desc 2", capacity: 1, uniformList: [{ id: "u1" }], isReserve: true },
];
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
    generation: mockGenerationLists[0][1],
    size: mockSizeLists[0].uniformSizes[0],
    comment: "Test comment",
    isReserve: false,
    type: {
        id: mockTypeList[0].id,
        name: mockTypeList[0].name,
    },
    issuedEntries: [
        {
            dateIssued: new Date('2023-10-01T12:00:00Z'),
            cadet: {
                id: 'cadet1',
                firstname: 'John',
                lastname: 'Doe',
                recdelete: null,
            },
        },
    ],
    storageUnit: null
} satisfies UniformWithOwner;
export const mockUniformHistory: UniformHistroyEntry[] = [
    {
        id: "0a24df36-c4c7-41ee-b236-db3666a1bb67",
        dateIssued: new Date('2023-10-01T12:00:00Z'),
        dateReturned: null,
        cadet: {
            id: 'cadet1',
            firstname: 'John',
            lastname: 'Doe',
            recdelete: null,
        },
    },
    {
        id: "35f1957d-8cea-4091-b7c2-1299d0515e64",
        dateIssued: new Date('2023-10-02T12:00:00Z'),
        dateReturned: new Date('2023-10-03T12:00:00Z'),
        cadet: {
            id: 'cadet2',
            firstname: 'Jane',
            lastname: 'Smith',
            recdelete: new Date('2023-10-03T12:00:00Z'),
        },
    },
];