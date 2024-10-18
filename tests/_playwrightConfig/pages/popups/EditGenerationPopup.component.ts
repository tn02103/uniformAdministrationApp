import { Locator, Page } from "playwright/test";
import { PopupComponent } from "./Popup.component";

export class EditGenerationPopupComponent extends PopupComponent {

    readonly txt_name: Locator;
    readonly chk_outdated: Locator;
    readonly sel_sizelist: Locator;
    readonly err_name: Locator;
    readonly err_sizelist: Locator;

    constructor(page: Page) {
        super(page);

        this.txt_name = this.div_popup.locator('input[name="name"]');
        this.chk_outdated = this.div_popup.locator('input[name="outdated"]');
        this.sel_sizelist = this.div_popup.locator('select[name="fk_sizelist"]');

        this.err_name = this.div_popup.getByTestId("err_name");
        this.err_sizelist = this.div_popup.getByTestId("err_sizelist");
    }
}
