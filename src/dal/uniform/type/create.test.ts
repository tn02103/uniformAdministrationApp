import { UniformType } from "@/prisma/client";
import { uniformTypeArgs } from "@/types/globalUniformTypes";
import { prismaMock } from '@test-utils/prisma-mock';
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
    
    afterEach(() => {
        vi.clearAllMocks();
        // Reset all mock implementations to their default state
        prismaMock.uniformType.findFirst.mockReset();
        prismaMock.uniformType.count.mockReset();
        prismaMock.uniformType.create.mockReset();
    });
    it('should create a new uniform type', async () => {
        prismaMock.uniformType.findFirst.mockResolvedValue(null);
        prismaMock.uniformType.count.mockResolvedValue(4);
        prismaMock.uniformType.create.mockResolvedValue("Created" as unknown as UniformType);

        const result = await create(defaultProps);
        expect(result).toEqual("Created");
        expect(prismaMock.uniformType.findFirst).toHaveBeenCalledTimes(2);
        expect(prismaMock.uniformType.findFirst).toHaveBeenCalledWith({
            where: {
                fk_assosiation: "test-assosiation-id",
                recdelete: null, // Ensure we are checking only for active types
                name: defaultProps.name,
            }
        });
        expect(prismaMock.uniformType.findFirst).toHaveBeenCalledWith({
            where: {
                fk_assosiation: "test-assosiation-id",
                recdelete: null, // Ensure we are checking only for active types
                acronym: defaultProps.acronym,
            }
        });
        expect(prismaMock.uniformType.count).toHaveBeenCalledTimes(1);
        expect(prismaMock.uniformType.count).toHaveBeenCalledWith({
            where: {
                fk_assosiation: "test-assosiation-id",
                recdelete: null,
            }
        });
        expect(prismaMock.uniformType.create).toHaveBeenCalledTimes(1);
        expect(prismaMock.uniformType.create).toHaveBeenCalledWith({
            data: {
                ...defaultProps,
                fk_assosiation: 'test-assosiation-id',
                sortOrder: 4,
            },
            ...uniformTypeArgs,
        });
    });

    it('should return error if name is duplicated', async () => {
        prismaMock.uniformType.findFirst
            .mockResolvedValueOnce({ name: defaultProps.name } as unknown as UniformType)
            .mockResolvedValueOnce(null);
        prismaMock.uniformType.count.mockResolvedValue(4);

        const result = await create(defaultProps);
        expect(result).toEqual({
            error: {
                message: "custom.uniform.type.nameDuplication",
                formElement: "name",
            }
        });
        expect(prismaMock.uniformType.findFirst).toHaveBeenCalledTimes(1);
        expect(prismaMock.uniformType.findFirst).toHaveBeenCalledWith({
            where: {
                fk_assosiation: 'test-assosiation-id',
                recdelete: null,
                name: defaultProps.name,
            }
        });
        expect(prismaMock.uniformType.create).not.toHaveBeenCalled();
    });
    it('should return error if acronym is duplicated', async () => {
        prismaMock.uniformType.findFirst
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ acronym: defaultProps.acronym, name: defaultProps.name } as unknown as UniformType);
        prismaMock.uniformType.count.mockResolvedValue(4);

        const result = await create(defaultProps);
        expect(result).toEqual({
            error: {
                message: "custom.uniform.type.acronymDuplication;name:" + defaultProps.name,
                formElement: "acronym",
            }
        });
        expect(prismaMock.uniformType.findFirst).toHaveBeenCalledTimes(2);
        expect(prismaMock.uniformType.findFirst).toHaveBeenCalledWith({
            where: {
                fk_assosiation: 'test-assosiation-id',
                recdelete: null,
                name: defaultProps.name,
            }
        });
        expect(prismaMock.uniformType.findFirst).toHaveBeenCalledWith({
            where: {
                fk_assosiation: 'test-assosiation-id',
                recdelete: null,
                acronym: defaultProps.acronym,
            }
        });
        expect(prismaMock.uniformType.create).not.toHaveBeenCalled();
    });
    it('should not return error if fk_defaultSizelist is null and usingSizes is false', async () => {
        const props = {
            ...defaultProps,
            fk_defaultSizelist: null,
            usingSizes: false,
        };
        prismaMock.uniformType.findFirst.mockResolvedValue(null);
        prismaMock.uniformType.count.mockResolvedValue(2);
        prismaMock.uniformType.create.mockResolvedValue('Created' as unknown as UniformType);

        const result = await create(props);
        expect(result).toEqual('Created');
        expect(prismaMock.uniformType.findFirst).toHaveBeenCalledTimes(2);
        expect(prismaMock.uniformType.count).toHaveBeenCalledTimes(1);
        expect(prismaMock.uniformType.create).toHaveBeenCalledTimes(1);
        expect(prismaMock.uniformType.create).toHaveBeenCalledWith({
            data: {
                ...props,
                fk_assosiation: 'test-assosiation-id',
                sortOrder: 2,
            },
            ...uniformTypeArgs,
        });
    });

    it('should set sortOrder to the count of existing uniform types', async () => {
        prismaMock.uniformType.findFirst.mockResolvedValue(null);
        prismaMock.uniformType.count.mockResolvedValue(7); // Existing count of 7
        prismaMock.uniformType.create.mockResolvedValue('Created' as unknown as UniformType);

        const result = await create(defaultProps);
        expect(result).toEqual('Created');
        expect(prismaMock.uniformType.create).toHaveBeenCalledWith({
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
        prismaMock.uniformType.findFirst.mockResolvedValue(null);

        const result = await create(propsWithNullSizelist);
        
        expect(result).toEqual({
            error: {
                message: "pleaseSelect",
                formElement: "fk_defaultSizelist"
            }
        });
        expect(prismaMock.uniformType.create).not.toHaveBeenCalled();
    });
});
