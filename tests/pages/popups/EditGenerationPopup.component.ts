import { Locator, Page } from "playwright/test";
import { PopupComponent } from "./Popup.component";

export class EditGenerationPopupComponent extends PopupComponent {

    readonly txt_name: Locator;
    readonly chk_outdated: Locator;
    readonly sel_sizeList: Locator;
    readonly err_name: Locator;
    readonly err_sizeList: Locator;

    constructor(page: Page) {
        super(page);

        this.txt_name = this.div_popup.locator('input[name="name"]');
        this.chk_outdated = this.div_popup.locator('input[name="outdated"]');
        this.sel_sizeList = this.div_popup.locator('select[name="fk_sizeList"]');

        this.err_name = this.div_popup.getByTestId("err_name");
        this.err_sizeList = this.div_popup.getByTestId("err_sizeList");
    }
}
