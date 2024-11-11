import { Locator, Page } from "playwright/test";

export class CadetDataComponent {

    // CadetDataTable
    readonly div_card: Locator;
    readonly div_header: Locator;
    readonly btn_edit: Locator;
    readonly btn_save: Locator;
    readonly btn_cancel: Locator;

    readonly txt_lastname: Locator;
    readonly txt_firstname: Locator;
    readonly chk_active: Locator;
    readonly div_active: Locator;
    readonly lbl_active: Locator;
    readonly txt_comment: Locator;

    readonly err_lastname: Locator;
    readonly err_firstname: Locator;
    readonly div_lastInspection: Locator;

    constructor(page: Page) {
        this.div_card = page.getByTestId('div_personalData');
        this.div_header = this.div_card.getByTestId('div_header');
        this.btn_edit = this.div_card.getByTestId('btn_edit');
        this.btn_cancel = this.div_card.getByTestId('btn_cancel');
        this.btn_save = this.div_card.getByTestId('btn_save');

        this.txt_lastname = this.div_card.locator('input[name="lastname"]');
        this.txt_firstname = this.div_card.locator('input[name="firstname"]');
        this.txt_comment = this.div_card.locator('textarea[name="comment"]');
        this.chk_active = this.div_card.locator('input[name="active"]');
        this.div_active = this.div_card.getByTestId('div_active');
        this.lbl_active = this.chk_active.locator('..').locator('label[class="form-check-label"]');

        this.err_lastname = this.div_card.getByTestId('err_lastname');
        this.err_firstname = this.div_card.getByTestId('err_firstname');
        this.div_lastInspection = this.div_card.getByTestId('div_lastInspection');
    }
}
