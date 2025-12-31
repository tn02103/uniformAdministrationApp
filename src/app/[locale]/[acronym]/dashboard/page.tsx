import { getUniformCountBySizeForType, getUniformCountByType } from '@/dal/charts/UniformCounts';
import { UniformCountBySizeForTypeChart } from './_Charts/UniformCountBySizeForTypeChart';
import { UniformTypesOverviewChart } from './_Charts/UniformTypesOverviewChart';
import { getUniformTypeList } from '@/dal/uniform/type/_index';
import { ExportLinks, TypeSelect } from './_Components/Components';
import { ExpandableArea } from '@/components/ExpandableArea/ExpandableArea';
import { Row } from 'react-bootstrap';
import { getI18n } from '@/lib/locales/config';

type PageProps = {
    searchParams: Promise<{
        selectedTypeId?: string;
    }>;
}
const Page = async (props: PageProps) => {
    const [t, searchParams, uniformTypeList] = await Promise.all([
        getI18n(),
        props.searchParams,
        getUniformTypeList()
    ]);
    const selectedTypeId = searchParams.selectedTypeId || uniformTypeList[0]?.id || '';

    // Get uniform data grouped by size with different categories
    const countForUniformType = getUniformCountBySizeForType(selectedTypeId);

    // Get uniform type overview data
    const countForUniformTypeList = getUniformCountByType();
    await Promise.all([countForUniformType, countForUniformTypeList]);
    
    return (
        <div>
            <h1>{t('admin.dashboard.header.page')}</h1>
            <h2>{t('admin.dashboard.header.uniformCounts')}</h2>
            <Row>
                <ExpandableArea header={t('admin.dashboard.header.uniformCountsByType')} headerClassName='fw-bold fs-4 align-start' defaultExpanded>
                    <UniformTypesOverviewChart data={await countForUniformTypeList} />
                </ExpandableArea>
            </Row>
            <Row>
                <ExpandableArea header={t('admin.dashboard.header.uniformCountsBySize', { type: uniformTypeList.find(type => type.id === selectedTypeId)?.name || '' })} headerClassName='fw-bold fs-4' defaultExpanded>
                    <TypeSelect initialValue={selectedTypeId} uniformTypeList={uniformTypeList} paramName="selectedTypeId" />
                    <UniformCountBySizeForTypeChart data={await countForUniformType} />
                </ExpandableArea>
            </Row>
            <ExportLinks />
            <div style={{ height: "200px" }}>

            </div>
        </div>
    )
}

export default Page;
