import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { uniformTypeArgs } from "@/types/globalUniformTypes";
import { create } from "./create";


beforeAll(() => {
    global.__ASSOSIATION__ = '1';
    global.__ROLE__ = AuthRole.admin;
});
afterAll(() => {
    global.__ASSOSIATION__ = undefined;
    global.__ROLE__ = undefined;
});

jest.mock('@/lib/db', () => ({
    prisma: {
        uniformType: {
            findFirst: jest.fn(),
            findUniqueOrThrow: jest.fn(),
            create: jest.fn(() => 'Created'),
            count: jest.fn(),
        },
        $transaction: jest.fn((func) => func(prisma)),
    }
}));
jest.mock("@/actions/validations", () => ({
    genericSAValidator: jest.fn((_, props) => Promise.resolve([{ assosiation: '1' }, props])),
}));

const defaultProps = {
    name: 'Uniform Type 1',
    acronym: 'UT1',
    issuedDefault: 2,
    usingSizes: true,
    usingGenerations: false,
    fk_defaultSizelist: 'sizelistId',
}

describe('<UniformType> create', () => {
    afterEach(jest.clearAllMocks);

    const prismafindFirst = prisma.uniformType.findFirst as jest.Mock;
    const prismaCount = prisma.uniformType.count as jest.Mock;
    const prismaCreate = prisma.uniformType.create as jest.Mock;

    it('should create a new uniform type', async () => {
        prismafindFirst.mockResolvedValue(null).mockResolvedValue(null);
        prismaCount.mockResolvedValue(4);

        const result = await create(defaultProps);
        expect(result).toEqual('Created');
        expect(prismafindFirst).toHaveBeenCalledTimes(2);
        expect(prismafindFirst).toHaveBeenCalledWith({
            where: {
                fk_assosiation: '1',
                recdelete: null,
                name: defaultProps.name,
            }
        });
        expect(prismafindFirst).toHaveBeenCalledWith({
            where: {
                fk_assosiation: '1',
                recdelete: null,
                acronym: defaultProps.acronym,
            }
        });
        expect(prismaCount).toHaveBeenCalledTimes(1);
        expect(prismaCount).toHaveBeenCalledWith({
            where: {
                fk_assosiation: '1',
                recdelete: null,
            }
        });
        expect(prisma.uniformType.create).toHaveBeenCalledTimes(1);
        expect(prismaCreate).toHaveBeenCalledWith({
            data: {
                ...defaultProps,
                fk_assosiation: '1',
                sortOrder: 4,
            },
            ...uniformTypeArgs,
        });
    });

    it('should return error if name is duplicated', async () => {
        prismafindFirst.mockImplementation((props: any) => props.where.name ? { name: defaultProps.name } : null);
        prismaCount.mockResolvedValue(4);

        const result = await create(defaultProps);
        expect(result).toEqual({
            error: {
                message: "custom.uniform.type.nameDuplication",
                formElement: "name",
            }
        });
        expect(prismafindFirst).toHaveBeenCalledTimes(1);
        expect(prismafindFirst).toHaveBeenCalledWith({
            where: {
                fk_assosiation: '1',
                recdelete: null,
                name: defaultProps.name,
            }
        });
        expect(prismaCreate).not.toHaveBeenCalled();
    });
    it('should return error if acronym is duplicated', async () => {
        prismafindFirst.mockImplementation((props: any) => props.where.acronym ? { acronym: defaultProps.acronym, name: defaultProps.name } : null);
        prismaCount.mockResolvedValue(4);

        const result = await create(defaultProps);
        expect(result).toEqual({
            error: {
                message: "custom.uniform.type.acronymDuplication;name:" + defaultProps.name,
                formElement: "acronym",
            }
        });
        expect(prismafindFirst).toHaveBeenCalledTimes(2);
        expect(prismafindFirst).toHaveBeenCalledWith({
            where: {
                fk_assosiation: '1',
                recdelete: null,
                name: defaultProps.name,
            }
        });
        expect(prismafindFirst).toHaveBeenCalledWith({
            where: {
                fk_assosiation: '1',
                recdelete: null,
                acronym: defaultProps.acronym,
            }
        });
        expect(prismaCreate).not.toHaveBeenCalled();
    });
    it('should return error if fk_defaultSizelist is null and usingSizes is true', async () => {
        const props = { ...defaultProps, usingSizes: true, fk_defaultSizelist: null };
        prismafindFirst.mockResolvedValue(null);
        prismaCount.mockResolvedValue(4);

        const result = await create(props);
        expect(result).toEqual({
            error: {
                message: "pleaseSelect",
                formElement: "fk_defaultSizelist"
            }
        });
        expect(prismafindFirst).toHaveBeenCalledTimes(2);
        expect(prismaCreate).not.toHaveBeenCalled();
    });
    it('should not return error if fk_defaultSizelist is null and usingSizes is false', async () => {
        const props = {
            ...defaultProps,
            fk_defaultSizelist: null,
            usingSizes: false,
        };
        prismafindFirst.mockResolvedValue(null);
        prismaCount.mockResolvedValue(2);

        const result = await create(props);
        expect(result).toEqual('Created');
        expect(prismafindFirst).toHaveBeenCalledTimes(2);
        expect(prismaCount).toHaveBeenCalledTimes(1);
        expect(prismaCreate).toHaveBeenCalledTimes(1);
        expect(prismaCreate).toHaveBeenCalledWith({
            data: {
                ...props,
                fk_assosiation: '1',
                sortOrder: 2,
            },
            ...uniformTypeArgs,
        });
    });
});
