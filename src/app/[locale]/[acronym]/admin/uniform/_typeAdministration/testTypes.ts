import { UniformType } from "@/types/globalUniformTypes";

const sizeListIds = [
    'e667d674-7df8-436b-a2b8-77b06e063d36',
    'a961545b-28a7-409e-9200-1d85ccd53522',
    '07de1d59-4fc6-447b-98a6-da916e5792ef',
];
export const testTypes: UniformType[] = [
    {
        id: "fbe495ec-799e-46c9-8aa5-ca34e1447bf4",
        name: "Test Type",
        acronym: "TT",
        sortOrder: 1,
        usingSizes: true,
        usingGenerations: true,
        issuedDefault: 2,
        fk_defaultSizelist: sizeListIds[0],
        defaultSizelist: {
            id: sizeListIds[0],
            name: "Test Size List",
        },
        uniformGenerationList: [
            {
                id: "ab5d155c-49cf-4019-831e-ca7b3e0bd51c",
                name: "Test Generation 1",
                outdated: false,
                sortOrder: 1,
                fk_sizelist: sizeListIds[0],
                sizelist: {
                    id: sizeListIds[0],
                    name: "Test Size List 1",
                },
            },
            {
                id: "7feb435c-ee23-486d-af9f-b7c874383e22",
                name: "Test Generation 2",
                outdated: false,
                sortOrder: 2,
                fk_sizelist: sizeListIds[1],
                sizelist: {
                    id: sizeListIds[1],
                    name: "Test Size List 2",
                },
            },
            {
                id: "c46adb18-1a04-4dda-884d-972a7aa0e0da",
                name: "Test Generation 3",
                outdated: true,
                sortOrder: 3,
                fk_sizelist: sizeListIds[1],
                sizelist: {
                    id: sizeListIds[1],
                    name: "Test Size List 2",
                },
            },
        ],
    }, {
        id: "c0f5f7d4-5e8b-4c1b-9f2a-7d7e7c6e3f1d",
        name: "Test Type 2",
        acronym: "TT2",
        sortOrder: 2,
        usingSizes: false,
        usingGenerations: false,
        issuedDefault: 1,
        fk_defaultSizelist: sizeListIds[2],
        defaultSizelist: {
            id: sizeListIds[2],
            name: "Test Size List 3",
        },
        uniformGenerationList: [],
    }, {
        id: "26c469f7-aae4-4398-8aba-5d131178c6f8",
        name: "Test Type 3",
        acronym: "TT3",
        sortOrder: 3,
        usingSizes: true,
        usingGenerations: false,
        issuedDefault: 0,
        fk_defaultSizelist: sizeListIds[0],
        defaultSizelist: {
            id: sizeListIds[0],
            name: "Test Size List 1",
        },
        uniformGenerationList: [
            {
                id: "ab5d155c-49cf-4019-831e-ca7b3e0bd51c",
                name: "Test Generation 1",
                outdated: false,
                sortOrder: 1,
                fk_sizelist: sizeListIds[0],
                sizelist: {
                    id: sizeListIds[0],
                    name: "Test Size List 1",
                },
            }
        ],
    }, {
        id: "d1e8b3c2-5a2b-4f8b-9c6e-7d7e7c6e3f1d",
        name: "Test Type 4",
        acronym: "TT4",
        sortOrder: 4,
        usingSizes: true,
        usingGenerations: true,
        issuedDefault: 0,
        fk_defaultSizelist: sizeListIds[0],
        defaultSizelist: {
            id: sizeListIds[0],
            name: "Test Size List 1",
        },
        uniformGenerationList: [
            {
                id: "ab5d155c-49cf-4019-831e-ca7b3e0bd51c",
                name: "Test Generation 1",
                outdated: false,
                sortOrder: 1,
                fk_sizelist: sizeListIds[0],
                sizelist: {
                    id: sizeListIds[0],
                    name: "Test Size List 1",
                },
            },
            {
                id: "7feb435c-ee23-486d-af9f-b7c874383e22",
                name: "Test Generation 2",
                outdated: false,
                sortOrder: 2,
                fk_sizelist: sizeListIds[1],
                sizelist: {
                    id: sizeListIds[1],
                    name: "Test Size List 2",
                },
            }
        ],
    }
]