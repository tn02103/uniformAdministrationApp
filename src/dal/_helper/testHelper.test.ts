import { cleanData, cleanDataV2 } from "./testHelper";

describe('cleanData', () => {
    it('cleans up data by removing specified attributes', () => {
        const data = {
            id: '123',
            name: 'Test',
            nested: {
                id: '456',
                value: 'Nested Value'
            }
        };
        const cleanedData = cleanData(data, ['id', 'nested.id']);
        expect(cleanedData).toEqual({
            name: 'Test',
            nested: {
                value: 'Nested Value'
            }
        });
    });

    it('cleans up data with multiple layers of nesting', () => {
        const data = {
            id: '123',
            name: 'Test',
            nested: {
                id: '456',
                value: 'Nested Value',
                deeper: {
                    id: '789',
                    value: 'Deeper Value'
                }
            }
        };
        const cleanedData = cleanData(data, ['nested.deeper.id']);
        expect(cleanedData).toEqual({
            id: '123',
            name: 'Test',
            nested: {
                id: '456',
                value: 'Nested Value',
                deeper: {
                    value: 'Deeper Value'
                }
            }
        });
    });

    it('cleans up data with arrays in different layers', () => {
        const data = {
            id: '123',
            name: 'Test',
            items: [
                {
                    id: '456',
                    value: 'Item 1',
                    nestedItems: [
                        {
                            id: '789',
                            value: 'Nested Item 1'
                        },
                        {
                            id: '101',
                            value: 'Nested Item 2'
                        }
                    ]
                },
                {
                    id: '112',
                    value: 'Item 2',
                    nestedItems: [
                        {
                            id: '113',
                            value: 'Nested Item 3'
                        }
                    ]
                }
            ]
        };
        const cleanedData = cleanData(data, ['items.id', 'items.nestedItems.id']);
        expect(cleanedData).toEqual({
            id: '123',
            name: 'Test',
            items: [
                {
                    value: 'Item 1',
                    nestedItems: [
                        {
                            value: 'Nested Item 1'
                        },
                        {
                            value: 'Nested Item 2'
                        }
                    ]
                },
                {
                    value: 'Item 2',
                    nestedItems: [
                        {
                            value: 'Nested Item 3'
                        }
                    ]
                }
            ]
        });
    });
    it('returns the original data if the attribute to remove does not exist', () => {
        const data = {
            id: '123',
            name: 'Test',
            nested: {
                id: '456',
                value: 'Nested Value'
            }
        };
        const cleanedData = cleanData(data, ['nonExistentAttribute']);
        expect(cleanedData).toEqual(data);
    });
    it('returns the original data if the nested-attribute to remove does not exist', () => {
        const data = {
            id: '123',
            name: 'Test',
            nested: {
                id: '456',
                value: 'Nested Value'
            }
        };
        const cleanedData = cleanData(data, ['nested.item.doesntexist']);
        expect(cleanedData).toEqual(data);
    });
});

describe('cleanDataV2', () => {
    it('cleans a one-layered object with ids and other attributes', () => {
        const data = {
            id: '12e4567e-e89b-12d3-a456-426614174000',
            name: 'Test',
            age: 30,
            isActive: true
        };
        const cleanedData = cleanDataV2(data);
        expect(cleanedData).toEqual({
            id: 'e4567e-e89b-12d3-a456-426614174000',
            name: 'Test',
            age: 30,
            isActive: true
        });
    });

    it('cleans a multi-layered object with ids and other attributes in each layer', () => {
        const data = {
            id: '12e4567e-e89b-12d3-a456-426614174000',
            nested: {
                id: '34e4567e-e89b-12d3-a456-426614174001',
                deeper: {
                    id: '56e4567e-e89b-12d3-a456-426614174002',
                    value: 'Deep Value'
                }
            }
        };
        const cleanedData = cleanDataV2(data);
        expect(cleanedData).toEqual({
            id: 'e4567e-e89b-12d3-a456-426614174000',
            nested: {
                id: 'e4567e-e89b-12d3-a456-426614174001',
                deeper: {
                    id: 'e4567e-e89b-12d3-a456-426614174002',
                    value: 'Deep Value'
                }
            }
        });
    });

    it('cleans an array of ids, strings, and numbers', () => {
        const data = [
            '12e4567e-e89b-12d3-a456-426614174000',
            'Test String',
            42
        ];
        const cleanedData = cleanDataV2(data);
        expect(cleanedData).toEqual([
            'e4567e-e89b-12d3-a456-426614174000',
            'Test String',
            42
        ]);
    });

    it('cleans an array of objects', () => {
        const data = [
            { id: '12e4567e-e89b-12d3-a456-426614174000', name: 'Item 1' },
            { id: '34e4567e-e89b-12d3-a456-426614174001', name: 'Item 2' }
        ];
        const cleanedData = cleanDataV2(data);
        expect(cleanedData).toEqual([
            { id: 'e4567e-e89b-12d3-a456-426614174000', name: 'Item 1' },
            { id: 'e4567e-e89b-12d3-a456-426614174001', name: 'Item 2' }
        ]);
    });

    it('cleans an object with arrays in some of its layers', () => {
        const data = {
            id: '12e4567e-e89b-12d3-a456-426614174000',
            items: [
                {
                    id: '34e4567e-e89b-12d3-a456-426614174001',
                    nestedItems: [
                        { id: '56e4567e-e89b-12d3-a456-426614174002', value: 'Nested Item 1' },
                        { id: '78e4567e-e89b-12d3-a456-426614174003', value: 'Nested Item 2' }
                    ]
                },
                {
                    id: '90e4567e-e89b-12d3-a456-426614174004',
                    nestedItems: [
                        { id: '12e4567e-e89b-12d3-a456-426614174000', value: 'Nested Item 3' }
                    ]
                }
            ]
        };
        const cleanedData = cleanDataV2(data);
        expect(cleanedData).toEqual({
            id: 'e4567e-e89b-12d3-a456-426614174000',
            items: [
                {
                    id: 'e4567e-e89b-12d3-a456-426614174001',
                    nestedItems: [
                        { id: 'e4567e-e89b-12d3-a456-426614174002', value: 'Nested Item 1' },
                        { id: 'e4567e-e89b-12d3-a456-426614174003', value: 'Nested Item 2' }
                    ]
                },
                {
                    id: 'e4567e-e89b-12d3-a456-426614174004',
                    nestedItems: [
                        { id: 'e4567e-e89b-12d3-a456-426614174000', value: 'Nested Item 3' }
                    ]
                }
            ]
        });
    });
});
