import { cleanData, cleanDataV2 } from "@/dal/_helper/testHelper";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { getUniformItemCountByType, getUniformItemLabels, getUniformListWithOwner } from "./_index";
import { getDeficiencies, getHistory } from "./get";

const { ids, data } = new StaticData(0);

it('should return a list of uniform history entries', async () => {
    const uniformId = ids.uniformIds[0][86];
    const result = await getHistory(uniformId);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    cleanData(result, ["id", "cadet.id", "cadet.recdelete"]);
    expect(result).toMatchSnapshot();
    expect(result[0].cadet.recdelete).toBeUndefined();
    expect(result[1].cadet.recdelete).toBeUndefined();
    expect(result[2].cadet.recdelete).toBeUndefined();
    expect(result[3].cadet.recdelete).not.toBeNull();
});
it('should return a list of defficiencies', async () => {
    const result = await getDeficiencies({ uniformId: ids.uniformIds[0][46] });

    expect(result).toBeDefined();
    expect(result.length).toBe(2);
    expect(result[0].dateCreated?.getTime()).toBeLessThan(result[1].dateCreated!.getTime());
    expect(cleanDataV2(result)).toMatchSnapshot()
});
it('should return a list of defficiencies with resolved', async () => {
    const result = await getDeficiencies({ uniformId: ids.uniformIds[0][46], includeResolved: true });

    expect(result).toBeDefined();
    expect(result.length).toBe(4);
    expect(result[0].dateCreated?.getTime()).toBeLessThan(result[1].dateCreated!.getTime());
    expect(result[1].dateCreated?.getTime()).toBeLessThan(result[2].dateCreated!.getTime());
    expect(result[2].dateCreated?.getTime()).toBeLessThan(result[3].dateCreated!.getTime());
    expect(cleanDataV2(result)).toMatchSnapshot()
});

describe('getCountByType', () => {
    it('should return the count of uniforms for a specific type', async () => {
        const uniformTypeId = ids.uniformTypeIds[0];
        const count = data.uniformList.filter(u => (u.fk_uniformType === uniformTypeId) && !u.recdelete).length;

        const result = await getUniformItemCountByType(uniformTypeId);

        expect(result).toBeDefined();
        expect(typeof result).toBe('number');
        expect(result).toBe(count);
    });
});

describe('getItemLabels', () => {
    it('should return a list of uniform item labels', async () => {
        const result = await getUniformItemLabels();

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);

        // Check structure of first item
        const firstItem = result[0];
        expect(firstItem).toHaveProperty('id');
        expect(firstItem).toHaveProperty('label');
        expect(firstItem).toHaveProperty('number');
        expect(firstItem).toHaveProperty('active');
        expect(firstItem).toHaveProperty('type');
        expect(firstItem.type).toHaveProperty('id');
        expect(firstItem.type).toHaveProperty('name');
        expect(firstItem.type).toHaveProperty('acronym');

        // Clean sensitive data for snapshot
        cleanData(result, ["id", "type.id", "owner?.id", "storageUnit?.id"]);
        expect(result.slice(0, 10)).toMatchSnapshot(); // Take first 10 for manageable snapshots
    });

    it('should include owner information when uniform is issued', async () => {
        const result = await getUniformItemLabels();
        const issuedItems = result.filter(item => item.owner !== null);

        expect(issuedItems.length).toBeGreaterThan(0);
        const issuedItem = issuedItems[0];
        expect(issuedItem.owner).toHaveProperty('id');
        expect(issuedItem.owner).toHaveProperty('firstname');
        expect(issuedItem.owner).toHaveProperty('lastname');
    });

    it('should include storage unit information when uniform is in storage', async () => {
        const result = await getUniformItemLabels();
        const storageItems = result.filter(item => item.storageUnit !== null);

        // At least check that the filter works correctly
        expect(storageItems.every(item => item.storageUnit !== null)).toBe(true);

        // If there are storage items, check their structure
        storageItems.forEach(storageItem => {
            expect(storageItem.storageUnit).toHaveProperty('id');
            expect(storageItem.storageUnit).toHaveProperty('name');
        });
    });
});

describe('<UniformItem> getListWithOwner', () => {
    it('sorts by number ascending', async () => {
        const result = await getUniformListWithOwner({
            uniformTypeId: ids.uniformTypeIds[0],
            orderBy: 'number',
            asc: true,
        });
        expect(result.length).toBeGreaterThan(1);
        for (let i = 1; i < result.length; i++) {
            expect(result[i].number).toBeGreaterThanOrEqual(result[i - 1].number);
        }
    });

    it('sorts by number descending', async () => {
        const result = await getUniformListWithOwner({
            uniformTypeId: ids.uniformTypeIds[0],
            orderBy: 'number',
            asc: false,
        });
        expect(result.length).toBeGreaterThan(1);
        for (let i = 1; i < result.length; i++) {
            expect(result[i].number).toBeLessThanOrEqual(result[i - 1].number);
        }
    });

    it('sorts by generation ascending', async () => {
        const result = await getUniformListWithOwner({
            uniformTypeId: ids.uniformTypeIds[0],
            orderBy: 'generation',
            asc: true,
        });
        expect(result.length).toBeGreaterThan(1);
        for (let i = 1; i < result.length; i++) {
            const prev = result[i - 1].generation?.name ?? 'ZZ';
            const curr = result[i].generation?.name ?? 'ZZ';
            expect(curr.localeCompare(prev)).toBeGreaterThanOrEqual(0);
        }
    });

    it('sorts by generation descending', async () => {
        const result = await getUniformListWithOwner({
            uniformTypeId: ids.uniformTypeIds[0],
            orderBy: 'generation',
            asc: false,
        });
        expect(result.length).toBeGreaterThan(1);
        for (let i = 1; i < result.length; i++) {
            const prev = result[i - 1].generation?.name ?? 'ZZ';
            const curr = result[i].generation?.name ?? 'ZZ';
            expect(curr.localeCompare(prev)).toBeLessThanOrEqual(0);
        }
    });

    it('sorts by size ascending', async () => {
        const result = await getUniformListWithOwner({
            uniformTypeId: ids.uniformTypeIds[0],
            orderBy: 'size',
            asc: true,
        });
        expect(result.length).toBeGreaterThan(1);
        for (let i = 1; i < result.length; i++) {
            const prev = result[i - 1].size?.name ?? 'ZZ';
            const curr = result[i].size?.name ?? 'ZZ';
            expect(curr.localeCompare(prev, undefined, { numeric: true })).toBeGreaterThanOrEqual(0);
        }
    });

    it('sorts by size descending', async () => {
        const result = await getUniformListWithOwner({
            uniformTypeId: ids.uniformTypeIds[0],
            orderBy: 'size',
            asc: false,
        });
        expect(result.length).toBeGreaterThan(1);
        for (let i = 1; i < result.length; i++) {
            const prev = result[i - 1].size?.name ?? 'ZZ';
            const curr = result[i].size?.name ?? 'ZZ';
            expect(curr.localeCompare(prev, undefined, { numeric: true })).toBeLessThanOrEqual(0);
        }
    });

    it('sorts by comment ascending', async () => {
        const result = await getUniformListWithOwner({
            uniformTypeId: ids.uniformTypeIds[0],
            orderBy: 'comment',
            asc: true,
        });
        expect(result.length).toBeGreaterThan(1);
        for (let i = 1; i < result.length; i++) {
            const prev = result[i - 1].comment ?? 'ZZ';
            const curr = result[i].comment ?? 'ZZ';
            expect(curr.localeCompare(prev)).toBeGreaterThanOrEqual(0);
        }
    });

    it('sorts by comment descending', async () => {
        const result = await getUniformListWithOwner({
            uniformTypeId: ids.uniformTypeIds[0],
            orderBy: 'comment',
            asc: false,
        });
        expect(result.length).toBeGreaterThan(1);
        for (let i = 1; i < result.length; i++) {
            const prev = result[i - 1].comment ?? 'ZZ';
            const curr = result[i].comment ?? 'ZZ';
            expect(curr.localeCompare(prev)).toBeLessThanOrEqual(0);
        }
    });

    it('sorts by owner ascending', async () => {
        const result = await getUniformListWithOwner({
            uniformTypeId: ids.uniformTypeIds[0],
            orderBy: 'owner',
            asc: true,
        });
        expect(result.length).toBeGreaterThan(1);

        // Partition the result
        const withOwner = result.filter(u => u.issuedEntries.length > 0);
        const withStorageUnit = result.filter(u => u.issuedEntries.length === 0 && u.storageUnit);
        const rest = result.filter(u => u.issuedEntries.length === 0 && !u.storageUnit);

        // 1. All with owner come first, sorted by lastname, firstname
        for (let i = 1; i < withOwner.length; i++) {
            const prev = withOwner[i - 1].issuedEntries[0].cadet!;
            const curr = withOwner[i].issuedEntries[0].cadet!;
            const cmpLast = `${curr.lastname}${curr.firstname}`.localeCompare(`${prev.lastname}${prev.firstname}`);
            expect(cmpLast).toBeGreaterThanOrEqual(0);
        }
        // 2. All with storageUnit come next, sorted by storageUnit.name
        for (let i = 1; i < withStorageUnit.length; i++) {
            const prev = withStorageUnit[i - 1].storageUnit!;
            const curr = withStorageUnit[i].storageUnit!;
            expect(curr.name.localeCompare(prev.name)).toBeGreaterThanOrEqual(0);
        }
        // 3. The rest are sorted by number
        for (let i = 1; i < rest.length; i++) {
            expect(rest[i].number).toBeGreaterThanOrEqual(rest[i - 1].number);
        }
        // 4. The order of the groups
        expect(result.slice(0, withOwner.length)).toEqual(withOwner);
        expect(result.slice(withOwner.length, withOwner.length + withStorageUnit.length)).toEqual(withStorageUnit);
        expect(result.slice(withOwner.length + withStorageUnit.length)).toEqual(rest);
    });

    it('sorts by owner descending', async () => {
        const result = await getUniformListWithOwner({
            uniformTypeId: ids.uniformTypeIds[0],
            orderBy: 'owner',
            asc: false,
        });
        expect(result.length).toBeGreaterThan(1);

        // Partition the result
        const withOwner = result.filter(u => u.issuedEntries.length > 0);
        const withStorageUnit = result.filter(u => u.issuedEntries.length === 0 && u.storageUnit);
        const rest = result.filter(u => u.issuedEntries.length === 0 && !u.storageUnit);

        // 1. All with owner come first, sorted by lastname, firstname (desc)
        for (let i = 1; i < withOwner.length; i++) {
            const prev = withOwner[i - 1].issuedEntries[0].cadet!;
            const curr = withOwner[i].issuedEntries[0].cadet!;
            const cmpLast = `${curr.lastname}${curr.firstname}`.localeCompare(`${prev.lastname}${prev.firstname}`);
            expect(cmpLast).toBeLessThanOrEqual(0);
        }
        // 2. All with storageUnit come next, sorted by storageUnit.name (desc)
        for (let i = 1; i < withStorageUnit.length; i++) {
            const prev = withStorageUnit[i - 1].storageUnit!;
            const curr = withStorageUnit[i].storageUnit!;
            expect(curr.name.localeCompare(prev.name)).toBeLessThanOrEqual(0);
        }
        // 3. The rest are sorted by number (desc)
        for (let i = 1; i < rest.length; i++) {
            expect(rest[i].number).toBeLessThanOrEqual(rest[i - 1].number);
        }
        // 4. The order of the groups
        expect(result.slice(0, rest.length)).toEqual(rest);
        expect(result.slice(rest.length, rest.length + withStorageUnit.length)).toEqual(withStorageUnit);
        expect(result.slice(rest.length + withStorageUnit.length)).toEqual(withOwner);
    });

    it('filters by generations', async () => {
        const generationId = ids.uniformGenerationIds[0];
        const result = await getUniformListWithOwner({
            uniformTypeId: ids.uniformTypeIds[0],
            orderBy: 'number',
            asc: true,
            filter: {
                generations: {
                    [ids.uniformGenerationIds[0]]: true,
                    [ids.uniformGenerationIds[1]]: false,
                }
            }
        });
        expect(result.length).toBeGreaterThan(1);
        expect(result.every(u => u.generation?.id === generationId)).toBe(true);
    });

    it('filters by sizes', async () => {
        const sizeId = ids.sizeIds[1];
        const result = await getUniformListWithOwner({
            uniformTypeId: ids.uniformTypeIds[0],
            orderBy: 'number',
            asc: true,
            filter: {
                sizes: {
                    [ids.sizeIds[0]]: false,
                    [ids.sizeIds[1]]: true,
                },
            },
        });
        expect(result.length).toBeGreaterThan(1);
        expect(result.every(u => u.size?.id === sizeId)).toBe(true);
    });

    it('filters active uniforms', async () => {
        const result = await getUniformListWithOwner({
            uniformTypeId: ids.uniformTypeIds[0],
            orderBy: 'number',
            asc: true,
            filter: {
                active: true,
                isReserve: false,
            }
        });
        expect(result.length).toBeGreaterThan(1);
        expect(result.every(u => u.active === true)).toBe(true);
    });

    it('filters reserve uniforms', async () => {
        const result = await getUniformListWithOwner({
            uniformTypeId: ids.uniformTypeIds[0],
            orderBy: 'number',
            asc: true,
            filter: {
                isReserve: true,
                active: false,
            }
        });
        expect(result.length).toBeGreaterThan(1);
        expect(result.every(u => u.active === false)).toBe(true);
    });

    it('filters issued uniforms', async () => {
        const result = await getUniformListWithOwner({
            uniformTypeId: ids.uniformTypeIds[0],
            orderBy: 'number',
            asc: true,
            filter: {
                issued: true,
                notIssued: false,
                inStorageUnit: false,
            }
        });
        expect(result.length).toBeGreaterThan(1);
        expect(result.every(u => u.issuedEntries.length > 0)).toBe(true);
    });

    it('filters not issued uniforms', async () => {
        const result = await getUniformListWithOwner({
            uniformTypeId: ids.uniformTypeIds[0],
            orderBy: 'number',
            asc: true,
            filter: {
                issued: false,
                notIssued: true,
                inStorageUnit: false,
            }
        });
        expect(result.length).toBeGreaterThan(1);
        expect(result.every(u => u.issuedEntries.length === 0)).toBe(true);
    });

    it('filters in storage unit', async () => {
        const result = await getUniformListWithOwner({
            uniformTypeId: ids.uniformTypeIds[0],
            orderBy: 'number',
            asc: true,
            filter: {
                active: true,
                isReserve: true,
                issued: false,
                notIssued: false,
                inStorageUnit: true,
            }
        });
        expect(result.length).toBeGreaterThan(1);
        expect(result.every(u => u.storageUnit?.id)).toBe(true);
    });

    it('filters in storage unit or issued', async () => {
        const result = await getUniformListWithOwner({
            uniformTypeId: ids.uniformTypeIds[0],
            orderBy: 'number',
            asc: true,
            filter: {
                active: true,
                isReserve: true,
                issued: true,
                notIssued: false,
                inStorageUnit: true,
            }
        });
        expect(result.length).toBeGreaterThan(1);
        expect(result.every(u => u.storageUnit?.id || u.issuedEntries.length > 0)).toBe(true);
    });
});
