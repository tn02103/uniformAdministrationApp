import { getAssosiationAnonymizationConfig } from "@/dal/assosiation";
import { getReturnProcessTemplateList } from "@/dal/cadet/returnProcessTemplate";
import { getI18n } from "@/lib/locales/config";
import { AnonymizationConfigSection } from "./_components/AnonymizationConfigSection";
import { ReturnProcessTemplateSection } from "./_components/ReturnProcessTemplateSection";

/**
 * Admin settings page — server component.
 * Fetches anonymisation config and return process templates server-side.
 */
export default async function AdminSettingsPage() {
    const t = await getI18n();
    const [config, templates] = await Promise.all([
        getAssosiationAnonymizationConfig(),
        getReturnProcessTemplateList(),
    ]);

    return (
        <div className="container-lg content-center bg-light rounded p-0 pt-2">
            <h1 className="text-center pt-3">{t('admin.settings.header')}</h1>
            <div className="d-flex flex-column align-items-center gap-4 p-3 p-md-4">
                <AnonymizationConfigSection initialConfig={config} />
                <ReturnProcessTemplateSection
                    initialTemplates={templates}
                    returnProcessEnabled={config.returnProcessEnabled}
                />
            </div>
        </div>
    );
}
