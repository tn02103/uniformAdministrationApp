import { getAssosiationAnonymizationConfig } from "@/dal/assosiation";
import { getResignationProcessTemplateList } from "@/dal";
import { getI18n } from "@/lib/locales/config";
import { AnonymizationConfigSection } from "./_components/AnonymizationConfigSection";
import { ResignationProcessTemplateSection } from "./_components/ResignationProcessTemplateSection";

/**
 * Admin settings page — server component.
 * Fetches anonymisation config and return process templates server-side.
 */
export default async function AdminSettingsPage() {
    const t = await getI18n();
    const [config, templates] = await Promise.all([
        getAssosiationAnonymizationConfig(),
        getResignationProcessTemplateList(),
    ]);

    return (
        <div className="container-lg content-center bg-light rounded p-0 pt-2">
            <h1 className="text-center pt-3">{t('admin.settings.header')}</h1>
            <div className="d-flex flex-column align-items-center gap-4 p-3 p-md-4">
                <AnonymizationConfigSection initialConfig={config} />
                <ResignationProcessTemplateSection
                    initialTemplates={templates}
                    resignationProcessEnabled={config.resignationProcessEnabled}
                />
            </div>
        </div>
    );
}
