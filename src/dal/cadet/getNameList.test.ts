import { getPersonnelNameList } from "@/dal/cadet/getNameList"
import { runServerActionTest } from "../_helper/testHelper"
import { StaticData } from "../../../tests/_playwrightConfig/testData/staticDataLoader";

const { ids, data } = new StaticData(0);
it('validate data', async () => {
    const { success, result } = await runServerActionTest(getPersonnelNameList);
    expect(success).toBeTruthy();
    expect(result).toHaveLength(9);

    expect(result.map(c => c.id)).not.toContain(ids.cadetIds[8]); // not include deleted
    // sortorder lastname asc
    expect(result[0].id).toBe(ids.cadetIds[1]); // Becker
    expect(result[3].id).toBe(ids.cadetIds[0]); // Fried
    expect(result[8].id).toBe(ids.cadetIds[6]); // Weismuller

    const cadet = data.cadets[1];
    expect(result[0]).toStrictEqual({
        id: cadet.id,
        lastname: cadet.lastname,
        firstname: cadet.firstname,
    });
});
