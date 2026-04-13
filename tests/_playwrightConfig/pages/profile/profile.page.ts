import { Locator, Page } from "playwright";
import { ChangePasswordModalComponent } from "./ChangePasswordModal.component";
import { MfaSectionComponent } from "./MfaSection.component";

export class ProfilePage {

    readonly page: Page;
    readonly changePasswordModal: ChangePasswordModalComponent;
    readonly mfaSection: MfaSectionComponent;

    // Account info section
    readonly div_accountInfo: Locator;
    // Devices section
    readonly div_devicesSection: Locator;

    constructor(page: Page) {
        this.page = page;
        this.changePasswordModal = new ChangePasswordModalComponent(page);
        this.mfaSection = new MfaSectionComponent(page);

        this.div_accountInfo = page.getByTestId('section-accountInfo');
        this.div_devicesSection = page.getByTestId('section-devices');
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
