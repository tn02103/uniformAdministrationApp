import { Locator, Page } from "playwright/test";
import { PopupComponent } from "./Popup.component";

export class DangerConfirmationModal extends PopupComponent {

    readonly div_message: Locator;
    readonly div_confirmationText: Locator;
    readonly txt_confirmation: Locator;
    readonly err_confirmation: Locator;

    constructor(page: Page) {
        super(page);

        this.div_message = this.div_popup.getByTestId("div_message");
        this.div_confirmationText = this.div_popup.getByTestId("div_confirmationText");
        this.txt_confirmation = this.div_popup.locator('input[name="confirmation"]');
        this.err_confirmation = this.div_popup.getByTestId("err_confirmation");
    }
}
