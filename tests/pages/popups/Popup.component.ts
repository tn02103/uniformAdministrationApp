import { Locator, Page } from "playwright/test";

export class PopupComponent {

    readonly div_popup: Locator;
    readonly div_header: Locator;
    readonly btn_cancel: Locator;
    readonly btn_save: Locator;

    constructor(page: Page) {
        this.div_popup = page.getByTestId("div_popup");
        this.div_header = this.div_popup.getByTestId("div_header");
        this.btn_cancel = this.div_popup.getByTestId("btn_cancel");
        this.btn_save = this.div_popup.getByTestId("btn_save");
    }
}
