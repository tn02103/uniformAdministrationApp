import { Locator, Page } from "playwright";

export class ChangePasswordModalComponent {

    readonly div_modal: Locator;
    readonly div_header: Locator;

    readonly txt_currentPassword: Locator;
    readonly err_currentPassword: Locator;

    readonly txt_newPassword: Locator;
    readonly err_newPassword: Locator;
    readonly div_passwordRequirements: Locator;

    readonly txt_confirmPassword: Locator;
    readonly err_confirmPassword: Locator;

    // Scoped to .modal-footer to avoid matching the header's × close button
    readonly btn_cancel: Locator;
    readonly btn_submit: Locator;

    constructor(page: Page) {
        this.div_modal = page.locator('.modal.show');
        this.div_header = this.div_modal.locator('.modal-header');

        this.txt_currentPassword = this.div_modal.locator('input[name="currentPassword"]');
        this.err_currentPassword = this.div_modal.getByTestId('err_currentPassword');

        this.txt_newPassword = this.div_modal.locator('input[name="newPassword"]');
        this.err_newPassword = this.div_modal.getByTestId('err_newPassword');
        // The requirements box is the role="alert" that renders a <ul> of rules
        this.div_passwordRequirements = this.div_modal.locator('[role="alert"]:has(ul)');

        this.txt_confirmPassword = this.div_modal.locator('input[name="confirmPassword"]');
        this.err_confirmPassword = this.div_modal.getByTestId('err_confirmPassword');

        this.btn_cancel = this.div_modal.locator('.modal-footer button[type="button"]');
        this.btn_submit = this.div_modal.locator('.modal-footer button[type="submit"]');
    }

    async fill(currentPassword: string, newPassword: string, confirmPassword: string) {
        await this.txt_currentPassword.fill(currentPassword);
        await this.txt_newPassword.fill(newPassword);
        await this.txt_confirmPassword.fill(confirmPassword);
    }
}
