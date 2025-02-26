import { cleanData } from "./testHelper";


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
