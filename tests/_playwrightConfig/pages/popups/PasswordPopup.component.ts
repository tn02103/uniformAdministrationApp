import { Locator, Page } from "playwright";
import { PopupComponent } from "./Popup.component";

export class PasswordPopupComponent extends PopupComponent {

    readonly txt_password: Locator;
    readonly txt_confirmationPassword: Locator;
    readonly err_password: Locator;
    readonly err_confirmationPassword: Locator;
    readonly err_confirmation: Locator;

    constructor(page: Page) {
        super(page);
        this.txt_password = this.div_popup.locator('input[name="password"]');
        this.txt_confirmationPassword = this.div_popup.locator('input[name="confirmationPassword"]');
        this.err_password = this.div_popup.getByTestId('err_password');
        this.err_confirmationPassword = this.div_popup.getByTestId('err_confirmationPassword');
        this.err_confirmation = this.div_popup.getByTestId('err_confirmation');
    }
}
