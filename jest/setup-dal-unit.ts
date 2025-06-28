import { AuthRole } from "@/lib/AuthRoles";

const prismaMock = {
    // Mock all Prisma models with common methods
    cadetInspection: {
        upsert: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
    },
    deficiency: {
        updateMany: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
    },
    deficiencyType: {
        findUniqueOrThrow: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
    },
    deregistration: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
    },
    uniform: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
    },
    uniformIssued: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
    },
    material: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
    },
    materialGroup: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
    },
    cadet: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
    },
    inspection: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
    },
    uniformType: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findFirstOrThrow: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    uniformGeneration: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    uniformSizelist: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    // Add mock for raw SQL execution
    $executeRaw: jest.fn(),
};
// Mock Prisma completely for unit tests - no real database connections
jest.mock('@/lib/db', () => ({
    prisma: {
        ...prismaMock,
        // Add transaction mock that handles both arrays and callback functions
        $transaction: jest.fn().mockImplementation((fnArrOrCallback) => {
            if (Array.isArray(fnArrOrCallback)) {
                // For array of promises, just await all of them
                return Promise.all(fnArrOrCallback);
            }
            // For callback function, call it with the prisma mock
            return fnArrOrCallback(prismaMock);
        }),

    },
}));

// Mock iron session for authentication in unit tests
jest.mock('@/lib/ironSession', () => ({
    getIronSession: jest.fn(() => ({
        user: {
            name: 'Test User',
            username: global.__USERNAME__ ?? 'testuser',
            assosiation: global.__ASSOSIATION__ ?? 'test-assosiation-id',
            acronym: 'TEST',
            role: global.__ROLE__ ?? AuthRole.materialManager,
        }
    })),
}));

// Mock Next.js cache functions
jest.mock('next/cache', () => ({
    unstable_cache: jest.fn((fn) => fn),
    revalidateTag: jest.fn(),
    revalidatePath: jest.fn(),
}));

// Mock validation helper for unit tests
jest.mock('@/actions/validations', () => ({
    genericSAValidator: jest.fn((_role, props) => {
        // Simple mock that returns the props and mock session data
        return Promise.resolve([
            {
                assosiation: global.__ASSOSIATION__ ?? 'test-assosiation-id',
                username: global.__USERNAME__ ?? 'testuser',
            },
            props
        ]);
    }),
}));

beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Set default global values for unit tests
    global.__ROLE__ = AuthRole.materialManager;
    global.__USERNAME__ = 'testuser';
    global.__ASSOSIATION__ = 'test-assosiation-id';
});
