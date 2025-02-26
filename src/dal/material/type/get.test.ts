import { cleanData, runServerActionTest } from "@/dal/_helper/testHelper";
import { AdministrationMaterialGroup, MaterialGroup } from "@/types/globalMaterialTypes";
import { getAdministrationConfiguration, getConfiguration } from "./get";

it('getMaterialConfiguration, validate snapshot', async () => {
    const { success, result } = await runServerActionTest<MaterialGroup[]>(getConfiguration());
    expect(success).toBeTruthy();
    cleanData(result, ['id', 'typeList.id']);
    expect(result).toMatchSnapshot();
});

it('getMaterialAdministrationConfiguration, validate snapshot', async () => {
    const { success, result } = await runServerActionTest<AdministrationMaterialGroup[]>(getAdministrationConfiguration());
    expect(success).toBeTruthy();
    cleanData(result, ['id', 'typeList.id']);
    expect(result).toMatchSnapshot();
});
