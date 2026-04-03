import { Page } from "playwright";
import { ChangePasswordModalComponent } from "./ChangePasswordModal.component";

export class ProfilePage {

    readonly page: Page;
    readonly changePasswordModal: ChangePasswordModalComponent;

    constructor(page: Page) {
        this.page = page;
        this.changePasswordModal = new ChangePasswordModalComponent(page);
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
