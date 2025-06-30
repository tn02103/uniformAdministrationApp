import { uniformTypeArgs } from "@/types/globalUniformTypes";
import { PrismaClient, UniformType } from "@prisma/client";
import { DeepMockProxy } from "jest-mock-extended";
import { create } from "./create";


// Get the mocked prisma client

const defaultProps = {
    name: 'Uniform Type 1',
    acronym: 'UT1',
    issuedDefault: 2,
    usingSizes: true,
    usingGenerations: false,
    fk_defaultSizelist: 'sizelistId',
}

describe('<UniformType> create', () => {
    const mockPrisma = jest.requireMock("@/lib/db").prisma as DeepMockProxy<PrismaClient>;
    
    afterEach(() => {
        jest.clearAllMocks();
        // Reset all mock implementations to their default state
        mockPrisma.uniformType.findFirst.mockReset();
        mockPrisma.uniformType.count.mockReset();
        mockPrisma.uniformType.create.mockReset();
    });
    it('should create a new uniform type', async () => {
        mockPrisma.uniformType.findFirst.mockResolvedValue(null);
        mockPrisma.uniformType.count.mockResolvedValue(4);
        mockPrisma.uniformType.create.mockResolvedValue("Created" as unknown as UniformType);

        const result = await create(defaultProps);
        expect(result).toEqual("Created");
        expect(mockPrisma.uniformType.findFirst).toHaveBeenCalledTimes(2);
        expect(mockPrisma.uniformType.findFirst).toHaveBeenCalledWith({
            where: {
                fk_assosiation: global.__ASSOSIATION__,
                recdelete: null, // Ensure we are checking only for active types
                name: defaultProps.name,
            }
        });
        expect(mockPrisma.uniformType.findFirst).toHaveBeenCalledWith({
            where: {
                fk_assosiation: global.__ASSOSIATION__,
                recdelete: null, // Ensure we are checking only for active types
                acronym: defaultProps.acronym,
            }
        });
        expect(mockPrisma.uniformType.count).toHaveBeenCalledTimes(1);
        expect(mockPrisma.uniformType.count).toHaveBeenCalledWith({
            where: {
                fk_assosiation: global.__ASSOSIATION__,
                recdelete: null,
            }
        });
        expect(mockPrisma.uniformType.create).toHaveBeenCalledTimes(1);
        expect(mockPrisma.uniformType.create).toHaveBeenCalledWith({
            data: {
                ...defaultProps,
                fk_assosiation: 'test-assosiation-id',
                sortOrder: 4,
            },
            ...uniformTypeArgs,
        });
    });

    it('should return error if name is duplicated', async () => {
        mockPrisma.uniformType.findFirst
            .mockResolvedValueOnce({ name: defaultProps.name } as unknown as UniformType)
            .mockResolvedValueOnce(null);
        mockPrisma.uniformType.count.mockResolvedValue(4);

        const result = await create(defaultProps);
        expect(result).toEqual({
            error: {
                message: "custom.uniform.type.nameDuplication",
                formElement: "name",
            }
        });
        expect(mockPrisma.uniformType.findFirst).toHaveBeenCalledTimes(1);
        expect(mockPrisma.uniformType.findFirst).toHaveBeenCalledWith({
            where: {
                fk_assosiation: 'test-assosiation-id',
                recdelete: null,
                name: defaultProps.name,
            }
        });
        expect(mockPrisma.uniformType.create).not.toHaveBeenCalled();
    });
    it('should return error if acronym is duplicated', async () => {
        mockPrisma.uniformType.findFirst
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ acronym: defaultProps.acronym, name: defaultProps.name } as unknown as UniformType);
        mockPrisma.uniformType.count.mockResolvedValue(4);

        const result = await create(defaultProps);
        expect(result).toEqual({
            error: {
                message: "custom.uniform.type.acronymDuplication;name:" + defaultProps.name,
                formElement: "acronym",
            }
        });
        expect(mockPrisma.uniformType.findFirst).toHaveBeenCalledTimes(2);
        expect(mockPrisma.uniformType.findFirst).toHaveBeenCalledWith({
            where: {
                fk_assosiation: 'test-assosiation-id',
                recdelete: null,
                name: defaultProps.name,
            }
        });
        expect(mockPrisma.uniformType.findFirst).toHaveBeenCalledWith({
            where: {
                fk_assosiation: 'test-assosiation-id',
                recdelete: null,
                acronym: defaultProps.acronym,
            }
        });
        expect(mockPrisma.uniformType.create).not.toHaveBeenCalled();
    });
    it('should not return error if fk_defaultSizelist is null and usingSizes is false', async () => {
        const props = {
            ...defaultProps,
            fk_defaultSizelist: null,
            usingSizes: false,
        };
        mockPrisma.uniformType.findFirst.mockResolvedValue(null);
        mockPrisma.uniformType.count.mockResolvedValue(2);
        mockPrisma.uniformType.create.mockResolvedValue('Created' as unknown as UniformType);

        const result = await create(props);
        expect(result).toEqual('Created');
        expect(mockPrisma.uniformType.findFirst).toHaveBeenCalledTimes(2);
        expect(mockPrisma.uniformType.count).toHaveBeenCalledTimes(1);
        expect(mockPrisma.uniformType.create).toHaveBeenCalledTimes(1);
        expect(mockPrisma.uniformType.create).toHaveBeenCalledWith({
            data: {
                ...props,
                fk_assosiation: 'test-assosiation-id',
                sortOrder: 2,
            },
            ...uniformTypeArgs,
        });
    });

    it('should set sortOrder to the count of existing uniform types', async () => {
        mockPrisma.uniformType.findFirst.mockResolvedValue(null);
        mockPrisma.uniformType.count.mockResolvedValue(7); // Existing count of 7
        mockPrisma.uniformType.create.mockResolvedValue('Created' as unknown as UniformType);

        const result = await create(defaultProps);
        expect(result).toEqual('Created');
        expect(mockPrisma.uniformType.create).toHaveBeenCalledWith({
            data: {
                ...defaultProps,
                fk_assosiation: 'test-assosiation-id',
                sortOrder: 7, // Should use the count as sortOrder
            },
            ...uniformTypeArgs,
        });
    });

    it('should throw validation error if fk_defaultSizelist is null but usingSizes is true', async () => {
        const propsWithNullSizelist = {
            ...defaultProps,
            usingSizes: true,
            fk_defaultSizelist: null,
        };
        mockPrisma.uniformType.findFirst.mockResolvedValue(null);

        const result = await create(propsWithNullSizelist);
        
        expect(result).toEqual({
            error: {
                message: "pleaseSelect",
                formElement: "fk_defaultSizelist"
            }
        });
        expect(mockPrisma.uniformType.create).not.toHaveBeenCalled();
    });
});
