import { cleanDataV2 } from '../_helper/testHelper';
import { getUnitsWithUniformItems } from './get';

it('returns correct data', async () => {
    const data = await getUnitsWithUniformItems();

    const cleanedData = cleanDataV2(data);
    expect(cleanedData).toMatchSnapshot();
});
