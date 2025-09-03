import { prisma } from "@/lib/db";
import { __unsecuredGetUniformTypeList } from "./get";
import { UniformTypeUpdateProps, update } from "./update";

jest.mock('./get', () => ({
    __unsecuredGetUniformTypeList: jest.fn(() => Promise.resolve('UpdatedList')),
}));

describe('<UniformType> update', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const mockFindMany = prisma.uniformType.findMany as jest.Mock;
    const mockUpdate = prisma.uniformType.update as jest.Mock;
    const mockGetList = __unsecuredGetUniformTypeList as jest.Mock;

    const defaultProps = {
        id: 'test-id-123',
        data: {
            name: "TestType",
            acronym: "TT",
            issuedDefault: 1,
            usingGenerations: true,
            usingSizes: false,
            fk_defaultSizelist: null,
        }
    };
    const getPropsWithData = (data: Partial<UniformTypeUpdateProps["data"]>) => {
        return {
            ...defaultProps,
            data: {
                ...defaultProps.data,
                ...data
            }
        }
    }

    const existingTypes = [
        { id: 'test-id-123', name: 'Current Type', acronym: 'CT' },
        { id: 'other-id', name: 'Other Type', acronym: 'OT' },
    ];

    beforeEach(() => {
        mockFindMany.mockResolvedValue(existingTypes);
        mockUpdate.mockResolvedValue({});
        mockGetList.mockResolvedValue('UpdatedList');
    });

    it('should update uniform type successfully', async () => {
        const result = await update(defaultProps);

        expect(result).toEqual('UpdatedList');
        expect(mockFindMany).toHaveBeenCalledWith({
            where: {
                organisationId: 'test-organisation-id',
                recdelete: null, // Ensure we are checking only for active types
            }
        });
        expect(mockUpdate).toHaveBeenCalledWith({
            where: { id: 'test-id-123' },
            data: defaultProps.data
        });
        expect(mockGetList).toHaveBeenCalledWith('test-assosiation-id', expect.anything());
    });

    it('should return error if name is duplicated', async () => {
        const result = await update(getPropsWithData({ name: 'Other Type' }));

        expect(result).toEqual({
            error: {
                message: "custom.uniform.type.nameDuplication",
                formElement: "name",
            }
        });
        expect(mockUpdate).not.toHaveBeenCalled();
        expect(mockGetList).not.toHaveBeenCalled();
    });

    it('should return error if acronym is duplicated', async () => {
        const result = await update(getPropsWithData({ acronym: 'OT' }));

        expect(result).toEqual({
            error: {
                message: "custom.uniform.type.acronymDuplication;name:Other Type",
                formElement: "acronym",
            }
        });
        expect(mockUpdate).not.toHaveBeenCalled();
        expect(mockGetList).not.toHaveBeenCalled();
    });

    it('should return error if usingSizes is true but fk_defaultSizelist is null', async () => {
        const result = await update(getPropsWithData({ usingSizes: true, fk_defaultSizelist: null }));

        expect(result).toEqual({
            error: {
                message: "pleaseSelect",
                formElement: "fk_defaultSizelist"
            }
        });
        expect(mockUpdate).not.toHaveBeenCalled();
        expect(mockGetList).not.toHaveBeenCalled();
    });

    it('should allow updating same type with same name/acronym', async () => {
        const result = await update(getPropsWithData({ name: 'Current Type', acronym: 'CT' }));

        expect(result).toEqual('UpdatedList');
        expect(mockUpdate).toHaveBeenCalled();
        expect(mockGetList).toHaveBeenCalled();
    });

    it('should allow usingSizes true with valid fk_defaultSizelist', async () => {
        const propsWithValidSizelist = getPropsWithData({ usingSizes: true, fk_defaultSizelist: 'sizelist-id' });

        const result = await update(propsWithValidSizelist);

        expect(result).toEqual('UpdatedList');
        expect(mockUpdate).toHaveBeenCalledWith({
            where: { id: 'test-id-123' },
            data: propsWithValidSizelist.data
        });
        expect(mockGetList).toHaveBeenCalled();
    });
    it('should allow !usingSizes with null fk_defaultSizelist', async () => {
        const propsWithNoSizes = getPropsWithData({ usingSizes: false, fk_defaultSizelist: null });

        const result = await update(propsWithNoSizes);

        expect(result).toEqual('UpdatedList');
        expect(mockUpdate).toHaveBeenCalledWith({
            where: { id: 'test-id-123' },
            data: propsWithNoSizes.data
        });
        expect(mockGetList).toHaveBeenCalled();
    });
});
