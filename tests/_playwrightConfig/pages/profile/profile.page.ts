import { Locator, Page } from "playwright";
import { ChangePasswordModalComponent } from "./ChangePasswordModal.component";
import { TwoFactorSectionComponent } from "./TwoFactorSection.component";

export class ProfilePage {

    readonly page: Page;
    readonly changePasswordModal: ChangePasswordModalComponent;
    readonly twoFactorSection: TwoFactorSectionComponent;

    // Account info section
    readonly div_accountInfo: Locator;
    // Devices section
    readonly div_devicesSection: Locator;

    constructor(page: Page) {
        this.page = page;
        this.changePasswordModal = new ChangePasswordModalComponent(page);
        this.twoFactorSection = new TwoFactorSectionComponent(page);

        this.div_accountInfo = page.locator('.card').filter({ hasText: 'Kontoinformationen' }).first();
        this.div_devicesSection = page.locator('.card').filter({ hasText: 'Vertrauenswürdige Geräte' }).first();
    }

    async goto(index: number) {
        await this.page.goto(`/de/test${index}/profile`);
    }

    async openChangePasswordModal() {
        // Before the modal opens there is exactly one "Passwort ändern" button on the page
        await this.page.getByRole('button', { name: 'Passwort ändern' }).click();
        await this.changePasswordModal.div_modal.waitFor({ state: 'visible' });
    }
}
