import { cleanData } from '../_helper/testHelper';
import { getUnitsWithUniformItems } from './get';

it('returns correct data', async () => {
    const data = await getUnitsWithUniformItems();

    const cleanedData = cleanData(data, ['id', 'assosiationId', 'uniformList.id', 'uniformList.type.id', 'uniformList.size.id', 'uniformList.generation.id']);
    expect(cleanedData).toMatchSnapshot();
});
