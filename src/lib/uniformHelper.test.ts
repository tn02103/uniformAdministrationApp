import { getUniformSizelist } from "./uniformHelper";
import { UniformSizelist, UniformType } from "../types/globalUniformTypes";


describe("getUniformSizelist", () => {
    const mockSizelists: UniformSizelist[] = [
        {
            id: "sizelist1", name: "Size List 1",
            uniformSizes: []
        },
        {
            id: "sizelist2", name: "Size List 2",
            uniformSizes: []
        },
        {
            id: "sizelist3", name: "Size List 3",
            uniformSizes: []
        },
    ];

    const mockUniformType: UniformType = {
        id: "type1",
        name: "Type 1",
        usingSizes: true,
        usingGenerations: true,
        fk_defaultSizelist: "sizelist1",
        acronym: "TT",
        issuedDefault: 0,
        sortOrder: 0,
        defaultSizelist: null,
        uniformGenerationList: [
            {
                id: "gen1", 
                fk_sizelist: "sizelist2",
                name: "",
                sortOrder: 0,
                isReserve: false,
                sizelist: null
            },
            {
                id: "gen2", 
                fk_sizelist: null,
                name: "",
                sortOrder: 0,
                isReserve: false,
                sizelist: null
            },
        ],
    };

    it("should return null if type is a string and not found in typeList", () => {
        const result = getUniformSizelist({
            sizelists: mockSizelists,
            type: "nonexistent",
            typeList: [mockUniformType],
        });
        expect(result).toBeNull();
    });

    it("should return null if uniformType.usingSizes is false", () => {
        const result = getUniformSizelist({
            sizelists: mockSizelists,
            type: { ...mockUniformType, usingSizes: false },
        });
        expect(result).toBeNull();
    });

    it("should return the sizelist based on generationId if usingGenerations is true", () => {
        const result = getUniformSizelist({
            sizelists: mockSizelists,
            type: mockUniformType,
            generationId: "gen1",
        });
        expect(result).toEqual(mockSizelists[1]);
    });

    it("should return the default sizelist if no generationId is provided", () => {
        const result = getUniformSizelist({
            sizelists: mockSizelists,
            type: mockUniformType,
            generationId: undefined,
        });
        expect(result).toEqual(mockSizelists[0]);
    });

    it("should return the default sizelist if generationId does not match any generation", () => {
        const result = getUniformSizelist({
            sizelists: mockSizelists,
            type: mockUniformType,
            generationId: "nonexistent",
        });
        expect(result).toEqual(mockSizelists[0]);
    });

    it("should return the default sizelist if generation has no sizelist", () => {
        const result = getUniformSizelist({
            sizelists: mockSizelists,
            type: mockUniformType,
            generationId: "gen2",
        });
        expect(result).toEqual(mockSizelists[0]);
    });

    it("should return default sizelist if usingGenerations is false", () => {
        const result = getUniformSizelist({
            sizelists: mockSizelists,
            type: { ...mockUniformType, usingGenerations: false },
            generationId: "gen1",
        });
        expect(result).toEqual(mockSizelists[0]);
    });
});