import { Deficiency } from "@/types/deficiencyTypes";
import { mockGenerationLists, mockSizeLists, mockTypeList } from "../../../tests/_jestConfig/staticMockData";
import { AuthRole } from "@/lib/AuthRoles";
import { UniformHistroyEntry, UniformWithOwner } from "@/types/globalUniformTypes";

// Registers a mock object in the global Vitest mock registry so that
// jest.requireMock(path) — via the shim in setup-components.tsx — can find it.
const _reg = <T>(path: string, mock: T): T => {
    ((globalThis as Record<string, unknown>).__vitestMockRegistry as Map<string, unknown>)
        ?.set(path, mock);
    return mock;
};

// ------------- MOCKS FOR DEFICIENCY -------------
const _dalInspectionMock = vi.hoisted(() => ({
    createDeficiency: vi.fn(async () => "created successfully"),
    resolveDeficiency: vi.fn(async () => "resolved successfully"),
    updateDeficiency: vi.fn(async () => "updated successfully"),
}));
vi.mock('@/dal/inspection/deficiency', () => _dalInspectionMock);

// dataFetcher/deficiency references module-level constants through closures;
// the _reg() call below runs in the module body (after the constants are defined).
const _dataFetcherDeficiencyMock = vi.hoisted(() => ({
    useDeficienciesByUniformId: vi.fn((_, includeResolved) => {
        if (includeResolved) {
            return { deficiencies: mockDeficiencyList };
        } else {
            return { deficiencies: mockDeficiencyList.slice(0, 2) };
        }
    }),
    useDeficiencyTypes: vi.fn(() => ({ deficiencyTypeList: mockDeficiencyTypeList })),
}));
vi.mock('@/dataFetcher/deficiency', () => _dataFetcherDeficiencyMock);

// ------------- MOCKS FOR UNIFORM -------------

vi.mock('@/dataFetcher/uniformAdmin', () => ({
    useUniformGenerationListByType: vi.fn(() => ({
        generationList: mockGenerationLists[0]
    })),
    useUniformTypeList: vi.fn(() => ({
        typeList: mockTypeList
    })),
}));

const _dalUniformItemMock = vi.hoisted(() => ({
    updateUniformItem: vi.fn(() => Promise.resolve('Saved item')),
    deleteUniformItem: vi.fn(() => Promise.resolve('Deleted item')),
    issueUniformItem: vi.fn(),
    createUniformItems: vi.fn(),
    getUniformItemDeficiencies: vi.fn(),
}));
vi.mock("@/dal/uniform/item/_index", () => _dalUniformItemMock);

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

const _dalStorageUnitMock = vi.hoisted(() => ({
    addUniformItemToStorageUnit: vi.fn(() => Promise.resolve()),
    removeUniformFromStorageUnit: vi.fn(() => Promise.resolve()),
}));
vi.mock("@/dal/storageUnit/_index", () => _dalStorageUnitMock);

// ------------- OTHER MOCKS -------------
const _swrMock = vi.hoisted(() => ({
    mutate: vi.fn(async () => { }),
}));
vi.mock("swr", () => _swrMock);

// Use a separate toast mock for these tests so the component and test assertions
// reference the same vi.fn() instances. This overrides the global setup mock.
const _toastifyMock = vi.hoisted(() => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));
vi.mock('react-toastify', () => _toastifyMock);

vi.mock("next/navigation", () => ({
    usePathname: () => "/de/app/uniform/list/81ff8e9b-a097-4879-a0b2-352e54d41e6c",
}));

// Register all hoisted mocks in the global registry after constants are defined.
// These are read by jest.requireMock() calls in the test files.
_reg('@/dal/inspection/deficiency', _dalInspectionMock);
_reg('@/dataFetcher/deficiency', _dataFetcherDeficiencyMock);
_reg('@/dal/uniform/item/_index', _dalUniformItemMock);
_reg('@/dal/storageUnit/_index', _dalStorageUnitMock);
_reg('swr', _swrMock);
_reg('react-toastify', _toastifyMock);

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
                deletedAt: null,
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
            deletedAt: null,
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
            deletedAt: new Date('2023-10-03T12:00:00Z'),
        },
    },
];