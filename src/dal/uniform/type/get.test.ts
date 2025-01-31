import { runServerActionTest } from "@/dal/_helper/testHelper";
import { getUniformType, getUniformTypeList } from "./get";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";

const { ids } = new StaticData(0);
describe('getUniformType', () => {
    it('should match snapshot', async () => {
        const {result, success } = await runServerActionTest(() => getUniformType(ids.uniformTypeIds[0]))
        expect(success).toBeTruthy();
        expect(result).toMatchSnapshot();
    });
    it('should not return type of different assosiation', async () => {
        const wrongStaticData = new StaticData(1);
        const {result, success} = await runServerActionTest(
            () => getUniformType(wrongStaticData.ids.uniformTypeIds[0])
        );

        expect(success).toBeTruthy();
        expect(result).toBeNull();
    });
    it('should not return deleted type', async () => {
        const {result, success} = await runServerActionTest(
            () => getUniformType(ids.uniformTypeIds[4])
        );
        expect(success).toBeTruthy();
        expect(result).toBeNull();
    });
});
describe('getUniformTypeList', () => {
    it('should match snapshot', async () => {
        const {success, result} = await runServerActionTest(getUniformTypeList);
        expect(success).toBeTruthy();
        expect(result).toMatchSnapshot();
    });
});