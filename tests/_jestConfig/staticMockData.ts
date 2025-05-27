
export const generationLists = [
    [
        {
            id: '8c0e873b-2b7d-4624-8a61-a192146f6587',
            name: 'Generation1-1',
            fk_sizelist: '9feb9d1a-654a-4829-a01b-74d6ffbd5405',
            outdated: true,
            sortOrder: 0,
            sizelist: { id: '9feb9d1a-654a-4829-a01b-74d6ffbd5405', name: 'Liste0' }
        },
        {
            id: '0292fdd9-9d47-4470-86b6-107c6f8797e4',
            name: 'Generation1-2',
            fk_sizelist: '9feb9d1a-654a-4829-a01b-74d6ffbd5405',
            outdated: false,
            sortOrder: 1,
            sizelist: { id: '9feb9d1a-654a-4829-a01b-74d6ffbd5405', name: 'Liste0' }
        },
        {
            id: '6649bcce-7ea2-4f8c-b5cc-85242f2f4dec',
            name: 'Generation1-3',
            fk_sizelist: '27021179-ec3d-4b04-9ed8-6ac53fdc3b4e',
            outdated: false,
            sortOrder: 2,
            sizelist: { id: '27021179-ec3d-4b04-9ed8-6ac53fdc3b4e', name: 'Liste1' }
        },
        {
            id: '654d3e11-caee-410d-af04-427a052d37dd',
            name: 'Generation1-4',
            fk_sizelist: 'cc0a225d-b3ec-4108-bd4b-451437d93fbf',
            outdated: false,
            sortOrder: 3,
            sizelist: null,
        }
    ],
    [
        {
            id: 'd85de47c-f465-4d2a-b696-6f7474bca261',
            name: 'Generation2-1',
            fk_sizelist: null,
            outdated: true,
            sortOrder: 0,
            sizelist: null
        },
        {
            id: '2e702b62-d250-4e89-a26c-b11d4c8f8a8e',
            name: 'Generation2-2',
            fk_sizelist: null,
            outdated: false,
            sortOrder: 1,
            sizelist: null
        }
    ],
]

export const typeList = [
    {
        id: '81ff8e9b-a097-4879-a0b2-352e54d41e6c',
        name: 'Typ1',
        acronym: 'AA',
        issuedDefault: 3,
        usingGenerations: true,
        usingSizes: true,
        fk_defaultSizelist: 'cc0a225d-b3ec-4108-bd4b-451437d93fbf',
        defaultSizelist: { id: 'cc0a225d-b3ec-4108-bd4b-451437d93fbf', name: 'Liste2' },
        uniformGenerationList: generationLists[0],
        sortOrder: 0
    },
    {
        id: 'f4bc1f1a-adb3-42e5-b162-006586b93049',
        name: 'Typ2',
        acronym: 'AB',
        issuedDefault: 1,
        usingGenerations: true,
        usingSizes: false,
        fk_defaultSizelist: null,
        defaultSizelist: null,
        uniformGenerationList: generationLists[1],
        sortOrder: 1
    },
    {
        id: 'a0d35fb2-7ea1-44a1-844c-5a38db88801b',
        name: 'Typ3',
        acronym: 'AC',
        issuedDefault: 1,
        usingGenerations: false,
        usingSizes: true,
        fk_defaultSizelist: '27021179-ec3d-4b04-9ed8-6ac53fdc3b4e',
        defaultSizelist: { id: '27021179-ec3d-4b04-9ed8-6ac53fdc3b4e', name: 'Liste1' },
        uniformGenerationList: [],
        sortOrder: 2
    },
    {
        id: '0a802c77-b0cc-4666-82b3-5c9f1255cf0a',
        name: 'Typ4',
        acronym: 'AD',
        issuedDefault: 1,
        usingGenerations: false,
        usingSizes: false,
        fk_defaultSizelist: null,
        defaultSizelist: null,
        uniformGenerationList: [],
        sortOrder: 3
    },
    {
        id: 'a7f1452a-e46d-475d-b1d0-5ed4705c5f7b',
        name: 'Typ5',
        acronym: 'AE',
        issuedDefault: 1,
        usingGenerations: false,
        usingSizes: false,
        fk_defaultSizelist: null,
        defaultSizelist: null,
        uniformGenerationList: [],
        sortOrder: 2
    },
]

export const sizeLists = [
    {
        id: '9feb9d1a-654a-4829-a01b-74d6ffbd5405',
        name: 'Liste0',
        uniformSizes: [
            {
                id: 'bc27d3eb-20f5-46fa-9140-7bb85c89b5bc',
                name: '0',
                sortOrder: 1
            },
            {
                id: '3e41ad07-23c6-44f6-b1eb-3f620a6811f8',
                name: '1',
                sortOrder: 2
            },
            {
                id: 'caef6dc5-9af5-461e-8025-551e9e240957',
                name: '2',
                sortOrder: 3
            },
            {
                id: '51d811d5-e624-4c03-859b-3fc2c26d185e',
                name: '3',
                sortOrder: 4
            },
            {
                id: '4ec167be-923b-4237-98de-fc62283f9c42',
                name: '4',
                sortOrder: 5
            }
        ]
    },
    {
        id: '27021179-ec3d-4b04-9ed8-6ac53fdc3b4e',
        name: 'Liste1',
        uniformSizes: [
            {
                id: 'bc27d3eb-20f5-46fa-9140-7bb85c89b5bc',
                name: '0',
                sortOrder: 1
            },
            {
                id: '3e41ad07-23c6-44f6-b1eb-3f620a6811f8',
                name: '1',
                sortOrder: 2
            },
            {
                id: 'caef6dc5-9af5-461e-8025-551e9e240957',
                name: '2',
                sortOrder: 3
            },
            {
                id: '51d811d5-e624-4c03-859b-3fc2c26d185e',
                name: '3',
                sortOrder: 4
            },
            {
                id: '4ec167be-923b-4237-98de-fc62283f9c42',
                name: '4',
                sortOrder: 5
            },
            {
                id: '65b7cfbb-3b50-4d2b-b4ee-a8c33d5b8951',
                name: '5',
                sortOrder: 6
            },
            {
                id: '87d437fd-ea2e-40e7-a311-17268c716ffa',
                name: '6',
                sortOrder: 7
            },
            {
                id: 'b33b06d5-dbed-42dc-9bbb-bf275dd92560',
                name: '7',
                sortOrder: 8
            },
            {
                id: 'df3ccd1b-5ff3-45dd-b435-f3c1fb2d9dc2',
                name: '8',
                sortOrder: 9
            },
            {
                id: '30138c39-4f57-4c00-aa5f-b906af997739',
                name: '9',
                sortOrder: 10
            }
        ]
    },
    {
        id: 'cc0a225d-b3ec-4108-bd4b-451437d93fbf',
        name: 'Liste2',
        uniformSizes: [
            {
                id: 'acdae0c0-303e-422b-814f-d23fca4722e3',
                name: 'Größe16',
                sortOrder: 17
            },
            {
                id: '27f11b9e-002b-4cc7-84eb-309d85420874',
                name: 'Größe17',
                sortOrder: 18
            },
            {
                id: '424e6967-facc-4885-a569-a1862ff54362',
                name: 'Größe18',
                sortOrder: 19
            },
            {
                id: '661ea790-03a4-4285-bdac-28f9dd388352',
                name: 'Größe19',
                sortOrder: 20
            }
        ]
    },
    {
        id: '5b892fd0-65bf-41b3-bc3b-2fca6be2ac1c',
        name: 'Liste3',
        uniformSizes: [
            {
                id: 'bc27d3eb-20f5-46fa-9140-7bb85c89b5bc',
                name: '0',
                sortOrder: 1
            },
            {
                id: '3e41ad07-23c6-44f6-b1eb-3f620a6811f8',
                name: '1',
                sortOrder: 2
            },
            {
                id: 'caef6dc5-9af5-461e-8025-551e9e240957',
                name: '2',
                sortOrder: 3
            },
            {
                id: '51d811d5-e624-4c03-859b-3fc2c26d185e',
                name: '3',
                sortOrder: 4
            },
            {
                id: '4ec167be-923b-4237-98de-fc62283f9c42',
                name: '4',
                sortOrder: 5
            }
        ]
    },
]
