import { AuthRole } from "@/lib/AuthRoles";
import { randomUUID } from "crypto";

// Mock server-only package to allow server components in Jest environment
jest.mock('server-only', () => ({}));

const prismaMock = {
    organisation: {
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
    user: {
        updateMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
    },
    twoFactorApp: {
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
    refreshToken: {
        updateMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
    },
    device: {
        update: jest.fn(),
        create: jest.fn(),
    },
    session: {
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
        updateMany: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
    },
    uniformSize: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
    },
    uniformIssued: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
    },
    material: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
    },
    materialGroup: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
    },
    uniformDeficiency: {
        upsert: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
    },
    cadetDeficiency: {
        upsert: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
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
        updateMany: jest.fn(),
    },
    uniformGeneration: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
    },
    uniformSizelist: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    redirect: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
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
            organisationId: global.__ORGANISATION__ ?? 'test-organisation-id',
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

jest.mock("@/actions/validations", () => ({
    genericSAValidator: jest.fn((_, props) => Promise.resolve([{
        organisationId: global.__ORGANISATION__ ?? 'test-organisation-id',
        username: global.__USERNAME__ ?? 'testuser',
    }, props])),
    genericSANoDataValidator: jest.fn(() => Promise.resolve([{
        organisationId: global.__ORGANISATION__ ?? 'test-organisation-id',
        username: global.__USERNAME__ ?? 'testuser'
    }])),
}));

beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Set default global values for unit tests
    global.__ROLE__ = AuthRole.materialManager;
    global.__USERNAME__ = 'testuser';
    global.__ORGANISATION__ = 'test-organisation-id';
});

const mockRateLimiterInstance = {
    testId: randomUUID(),
    consume: jest.fn(async () => ({
        remainingPoints: 10,
        msBeforeNext: 1000,
    })),
    get: jest.fn(async () => ({
        remainingPoints: 10,
        msBeforeNext: 1000,
    })),
    delete: jest.fn(async () => undefined),
    block: jest.fn(async () => undefined),
    penalty: jest.fn(async () => undefined),
    reward: jest.fn(async () => undefined),
};

const RateLimiterMemory = jest.fn(() => mockRateLimiterInstance);
// Mock rate-limiter-flexible BEFORE any imports that use it
jest.mock('rate-limiter-flexible', () => ({
    RateLimiterMemory
}));
