import { Locator, Page } from "playwright";

export default class GenerateStep1Component {
    readonly page: Page;

    readonly div_step1: Locator;
    readonly sel_continuous: Locator;
    readonly txt_amount_default: Locator;
    readonly err_amount_default: Locator;
    readonly err_itemCount: Locator;

    readonly btn_back: Locator;
    readonly btn_generate: Locator;

    txt_amount_size(sizeId: string) {
        return this.div_step1.locator(`input[name="values.${sizeId}"]`);
    }
    err_amount_size(sizeId: string) {
        return this.div_step1.getByTestId(`err_${sizeId}`);
    }
    constructor(page: Page) {
        this.page = page;
        this.div_step1 = page.locator('div[id="step1"]');
        this.sel_continuous = this.div_step1.locator('input[name="continuous"]');
        this.txt_amount_default = this.div_step1.locator('input[name="values.amount"]');
        this.err_amount_default = this.div_step1.getByTestId('err_amount');
        this.err_itemCount = this.div_step1.getByTestId('err_itemCount');

        this.btn_back = this.div_step1.getByTestId('btn_back');
        this.btn_generate = this.div_step1.getByTestId('btn_continue');
    }
}
