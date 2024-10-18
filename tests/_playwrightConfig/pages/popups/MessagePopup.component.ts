import { Locator, Page } from "playwright/test";

export class MessagePopupComponent {
    readonly div_popup: Locator;
    readonly div_header: Locator;
    readonly div_message: Locator;
    readonly btn_cancel: Locator;
    readonly btn_save: Locator;
    readonly btn_close: Locator;
    readonly div_icon: Locator;

    constructor(page: Page,) {
        this.div_popup = page.getByTestId("div_messageModal_popup");
        this.div_header = this.div_popup.getByTestId("div_header");
        this.div_message = this.div_popup.getByTestId('div_message');
        this.btn_cancel = this.div_popup.getByTestId("btn_cancel");
        this.btn_save = this.div_popup.getByTestId("btn_save");
        this.div_icon = this.div_popup.getByTestId('div_icon');
        this.btn_close = this.div_popup.locator('button[class="btn-close"]');
    }
}
