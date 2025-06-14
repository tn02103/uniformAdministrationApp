import { cleanData, runServerActionTest } from "@/dal/_helper/testHelper";

import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { getList, getType } from "./get";

const { ids } = new StaticData(0);

describe('<UniformType> get', () => {

    it('get should be successfull', async () => {
        const { result, success } = await runServerActionTest(getType(ids.uniformTypeIds[0]))
        expect(success).toBeTruthy();
        cleanData(result, ['id', 'fk_defaultSizelist', 'defaultSizelist.id', 'uniformGenerationList.id', 'uniformGenerationList.sizelist.id', 'uniformGenerationList.fk_sizelist']);
        expect(result).toMatchSnapshot();
    });
    it('getList', async () => {
        const { result, success } = await runServerActionTest(getList())
        expect(success).toBeTruthy();
        cleanData(result, ['id', 'fk_defaultSizelist', 'defaultSizelist.id', 'uniformGenerationList.id', 'uniformGenerationList.sizelist.id', 'uniformGenerationList.fk_sizelist']);
        expect(result).toMatchSnapshot();
    });
});
