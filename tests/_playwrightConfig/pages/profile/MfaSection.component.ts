import { Locator, Page } from "playwright";

export class MfaSectionComponent {

    readonly div_section: Locator;

    readonly btn_toggle: Locator;

    readonly div_appsList: Locator;
    readonly txt_noApps: Locator;
    readonly btn_addApp: Locator;

    readonly sel_defaultMethod: Locator;

    // Warning modal (simpleWarningModal) locators
    readonly div_warningModal: Locator;
    readonly btn_warningConfirm: Locator;
    readonly btn_warningCancel: Locator;

    constructor(page: Page) {
        this.div_section = page.getByTestId('section-mfa');

        // The toggle button – shows Aktivieren or Deaktivieren
        this.btn_toggle = this.div_section.locator('button').filter({
            hasText: /Aktivieren|Deaktivieren/,
        });

        this.div_appsList = this.div_section.locator('ul.list-group');
        this.txt_noApps = this.div_section.getByText('Keine TOTP-Apps konfiguriert');
        this.btn_addApp = this.div_section.getByRole('button', { name: 'TOTP-App hinzufügen' });

        this.sel_defaultMethod = page.locator('#twoFactorDefaultMethod_select-defaultMethod');

        this.div_warningModal = page.getByTestId('div_messageModal_popup');
        this.btn_warningConfirm = this.div_warningModal.getByTestId('btn_save');
        this.btn_warningCancel = this.div_warningModal.getByTestId('btn_cancel');
    }

    /** Returns the delete button for a given TOTP app by app name */
    appDeleteButton(appName: string): Locator {
        return this.div_section
            .locator('li.list-group-item')
            .filter({ hasText: appName })
            .getByRole('button');
    }
}
