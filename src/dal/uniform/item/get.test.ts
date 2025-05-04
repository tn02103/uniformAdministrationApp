import { cleanData, cleanDataV2 } from "@/dal/_helper/testHelper";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader"
import { getDeficiencies, getHistory } from "./get";

const { ids } = new StaticData(0);

it('should return a list of uniform history entries', async () => {
    const uniformId = ids.uniformIds[0][86];
    const result = await getHistory(uniformId);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    cleanData(result, ["id", "cadet.id", "cadet.recdelete"]);
    expect(result).toMatchSnapshot();
    expect(result[0].cadet.recdelete).toBeNull();
    expect(result[1].cadet.recdelete).toBeNull();
    expect(result[2].cadet.recdelete).toBeNull();
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
