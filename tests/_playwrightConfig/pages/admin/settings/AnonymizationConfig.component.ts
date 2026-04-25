import { Locator, Page } from "playwright/test";
import german from "../../../../../public/locales/de";

const t = german.admin.settings.anonymization;
const tCommon = german.common.actions;

export class AnonymizationConfigComponent {

    readonly page: Page;

    readonly chk_returnProcessEnabled: Locator;
    readonly sel_anonymizationMode: Locator;
    readonly txt_anonymizationDelayDays: Locator;
    readonly btn_save: Locator;
    readonly err_anonymizationDelayDays: Locator;
    readonly txt_success: Locator;

    constructor(page: Page) {
        this.page = page;

        this.chk_returnProcessEnabled = page.getByRole('switch', { name: t.returnProcessEnabled });
        this.sel_anonymizationMode = page.getByRole('combobox', { name: t.anonymizationMode });
        this.txt_anonymizationDelayDays = page.getByRole('spinbutton', { name: t.anonymizationDelayDays });
        this.btn_save = page.getByRole('form', { name: t.header }).getByRole('button', { name: tCommon.save });
        this.err_anonymizationDelayDays = page.getByTestId('err_anonymizationDelayDays');
        this.txt_success = page.getByText(t.success);
    }
}
