import { getScopedI18n } from "@/lib/locales/config";
import { ReactNode } from "react";

export async function generateMetadata() {
    const t = await getScopedI18n('pageTitles');
    return {
        title: t('uniform.new'),
    }
}
export default function Layout({ children }: { children: ReactNode }) {
    return (children)
}
