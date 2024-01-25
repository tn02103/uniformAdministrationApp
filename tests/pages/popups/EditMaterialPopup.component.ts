import { Locator, Page } from "playwright/test";
import { PopupComponent } from "./Popup.component";

export class EditMaterialPopupComponent extends PopupComponent {

    readonly txt_name: Locator;
    readonly err_name: Locator;
    readonly txt_actualQuantity: Locator;
    readonly err_actualQuantity: Locator;
    readonly txt_targetQuantity: Locator;
    readonly err_targetQuantity: Locator;

    constructor(page: Page) {
        super(page);

        this.txt_name = this.div_popup.locator('input[name="typename"]');
        this.err_name = this.div_popup.getByTestId('err_typename');
        this.txt_actualQuantity = this.div_popup.locator('input[name="actualQuantity"]');
        this.err_actualQuantity = this.div_popup.getByTestId('err_actualQuantity');
        this.txt_targetQuantity = this.div_popup.locator('input[name="targetQuantity"]');
        this.err_targetQuantity = this.div_popup.getByTestId('err_targetQuantity');

    }
}
