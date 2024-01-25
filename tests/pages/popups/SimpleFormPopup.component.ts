import { Locator, Page } from "playwright";
import { PopupComponent } from "./Popup.component";

export class SimpleFormPopupComponent {

    readonly div_message: Locator;
    readonly btn_close: Locator;
    readonly txt_input: Locator;
    readonly err_input: Locator;
    readonly div_popup: Locator;
    readonly div_header: Locator;
    readonly btn_cancel: Locator;
    readonly btn_save: Locator;

    constructor(page: Page, txt_input_locator?: string, err_input_testId?: string) {
        this.div_popup = page.getByTestId('div_simpleFormModal')
        this.div_header = this.div_popup.getByTestId("div_header");
        this.div_message = this.div_popup.getByTestId('div_message');

        this.btn_cancel = this.div_popup.getByTestId("btn_cancel");
        this.btn_save = this.div_popup.getByTestId("btn_save");
        this.btn_close = this.div_popup.locator('button[class="btn-close"]');

        this.txt_input = this.div_popup.locator(txt_input_locator ?? 'input[name="input"]');
        this.err_input = this.div_popup.getByTestId(err_input_testId ?? 'err_input');
    }
}
