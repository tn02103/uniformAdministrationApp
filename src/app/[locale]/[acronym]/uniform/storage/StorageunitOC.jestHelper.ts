import { StorageUnitWithUniformItems } from "@/dal/storageUnit/get";
import { mockUniformList } from "../../../../../../tests/_jestConfig/staticMockData";
import { UniformItemLabel } from "@/dal/uniform/item/_index";

jest.mock("@/dal/storageUnit/_index", () => ({
    addUniformItemToStorageUnit: jest.fn().mockResolvedValue(mockStorageUnitWithItems),
    deleteStorageUnit: jest.fn().mockResolvedValue(mockStorageUnitWithItems),
    removeUniformFromStorageUnit: jest.fn().mockResolvedValue(mockStorageUnitWithItems),
    createStorageUnit: jest.fn().mockResolvedValue(mockStorageUnitWithItems),
    updateStorageUnit: jest.fn().mockResolvedValue(mockStorageUnitWithItems),
}));

jest.mock("@/dataFetcher/storage", () => ({
    useStorageUnitsWithUniformItemList: jest.fn(() => ({
        mutate: jest.fn(),
        storageUnits: mockStorageUnitWithItems,
    })),
}));

jest.mock("@/dataFetcher/uniform", () => ({
    useUniformLabels: jest.fn(() => ({
        uniformLabels: mockUniformLabels,
        mutate: jest.fn(),
    })),
}));

const getUniformLabel = (data: Partial<UniformItemLabel>): UniformItemLabel => ({
    id: "1", label: "Uniform-1", number: 1, owner: null, active: true, storageUnit: null, type: { id: "type1", name: "Uniform", acronym: "AA" },
    ...data,
});

export const mockUniformLabels = [
    getUniformLabel({ id: "1", label: "Uniform-1", number: 1 }),
    getUniformLabel({ id: "2", label: "Uniform 2", number: 2, owner: { id: "c1", firstname: "John", lastname: "Doe" } }),
    getUniformLabel({ id: "3", label: "Uniform 3", number: 3, active: false }),
    getUniformLabel({ id: "4", label: "Uniform 4", storageUnit: { id: "s1", name: "Other Unit" } }),
] satisfies UniformItemLabel[]

export const mockStorageUnitWithItems: StorageUnitWithUniformItems[] = [
    {
        id: "19518cad-dd54-44fb-9e31-29ba4ed9b7f9",
        name: "Box 1",
        capacity: 10,
        isReserve: false,
        description: "This is a test storage unit.",
        assosiationId: "12345678-1234-1234-1234-123456789012",
        uniformList: [
            mockUniformList[0],
            mockUniformList[1],
        ],
    },
    {
        id: "2a3b4c5d-6e7f-8g9h-0i1j-2k3l4m5n6o7p",
        name: "Box 2",
        capacity: 20,
        isReserve: false,
        description: "This is another test storage unit.",
        assosiationId: "12345678-1234-1234-1234-123456789012",
        uniformList: [
            mockUniformList[2],
            mockUniformList[3],
        ],
    },
];
