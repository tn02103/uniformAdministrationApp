
import { AuthRole } from "@/lib/AuthRoles";

const prismaMock = {
    cadetInspection: {
        upsert: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
    },
    deficiency: {
        updateMany: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
        upsert: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
    },
    deficiencyType: {
        findUniqueOrThrow: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
    },
    deregistration: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
    },
    uniform: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
    },
    uniformSize: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
    },
    uniformIssued: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
    },
    material: {
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
    },
    materialGroup: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
    },
    uniformDeficiency: {
        upsert: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
    },
    cadetDeficiency: {
        upsert: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
    },
    cadet: {
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
    },
    inspection: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
    },
    uniformType: {
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        findFirstOrThrow: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
    },
    uniformGeneration: {
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
    },
    uniformSizelist: {
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    },
    storageUnit: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
    },
    assosiation: {
        create: vi.fn(),
        delete: vi.fn(),
    },
    redirect: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
    },
    $executeRaw: vi.fn(),
};

const prismaMockFull = {
    ...prismaMock,
    $transaction: vi.fn(),
};
prismaMockFull.$transaction.mockImplementation((fnArrOrCallback: unknown) => {
    if (Array.isArray(fnArrOrCallback)) {
        return Promise.all(fnArrOrCallback as Promise<unknown>[]);
    }
    return (fnArrOrCallback as (client: typeof prismaMockFull) => unknown)(prismaMockFull);
});

// Mock Prisma completely for unit tests - no real database connections
vi.mock('@/lib/db', () => ({
    prisma: prismaMockFull,
}));

// Mock iron session for authentication in unit tests
vi.mock('@/lib/ironSession', () => ({
    getIronSession: vi.fn(() => ({
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
vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((fn) => fn),
    revalidateTag: vi.fn(),
    revalidatePath: vi.fn(),
}));

vi.mock("@/actions/validations", () => ({
    genericSAValidator: vi.fn((_, props) => Promise.resolve([{
        assosiation: global.__ASSOSIATION__ ?? 'test-assosiation-id',
        username: global.__USERNAME__ ?? 'testuser',
    }, props])),
    genericSANoDataValidator: vi.fn(() => Promise.resolve([{
        assosiation: global.__ASSOSIATION__ ?? 'test-assosiation-id',
        username: global.__USERNAME__ ?? 'testuser'
    }])),
}));

// Mock server-only package to allow server-side modules in test environment
vi.mock('server-only', () => ({}));

// Export the typed prisma mock for use in test files
export { prismaMockFull as prismaMock };
