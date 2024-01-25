import { Locator, Page } from "playwright/test";

export class MaterialGroupDetailComponent {

    readonly page: Page;

    readonly div_mGroup: Locator;
    readonly div_header: Locator;
    readonly btn_edit: Locator;
    readonly btn_delete: Locator;

    readonly txt_name: Locator;
    readonly err_name: Locator;
    readonly txt_issuedDefault: Locator;
    readonly err_issuedDefault: Locator;
    readonly chk_multitypeAllowed: Locator;
    readonly div_multitypeAllowed: Locator;

    readonly btn_cancel: Locator;
    readonly btn_save: Locator;

    constructor(page: Page) {
        this.page = page;
        this.div_mGroup = page.getByTestId('div_mGroup_detail');
        this.div_header = this.div_mGroup.getByTestId('div_header');
        this.btn_edit = this.div_mGroup.getByTestId('btn_edit');
        this.btn_delete = this.div_mGroup.getByTestId('btn_delete');

        this.txt_name = this.div_mGroup.locator('input[name="description"]');
        this.err_name = this.div_mGroup.getByTestId('err_name');
        this.txt_issuedDefault = this.div_mGroup.locator('input[name="issuedDefault"]');
        this.err_issuedDefault = this.div_mGroup.getByTestId('err_issuedDefault');
        this.chk_multitypeAllowed = this.div_mGroup.locator('input[name="multitypeAllowed"]');
        this.div_multitypeAllowed = this.div_mGroup.getByTestId('div_multitypeAllowed');

        this.btn_cancel = this.div_mGroup.getByTestId('btn_cancel');
        this.btn_save = this.div_mGroup.getByTestId('btn_save');
    }
}
