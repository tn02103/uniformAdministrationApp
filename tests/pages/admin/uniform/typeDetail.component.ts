import { Locator, Page } from "playwright/test";

export class TypeDetailComponent {

    readonly page: Page;

    readonly div_card: Locator;
    readonly div_header: Locator;
    readonly btn_edit: Locator;
    readonly btn_save: Locator;
    readonly btn_cancel: Locator;

    readonly div_name: Locator;
    readonly div_acronym: Locator;
    readonly div_issuedDefault: Locator;
    readonly div_usingSizes: Locator;
    readonly div_usingGenerations: Locator;
    readonly div_defaultSL: Locator;

    readonly txt_name: Locator;
    readonly txt_acronym: Locator;
    readonly txt_issuedDefault: Locator;
    readonly chk_usingSizes: Locator;
    readonly chk_usingGenerations: Locator;
    readonly sel_defaultSL: Locator;

    readonly err_name: Locator;
    readonly err_acronym: Locator;
    readonly err_issuedDefault: Locator;
    readonly err_defaultSL: Locator;

    constructor(page: Page) {
        this.page = page;

        this.div_card = page.getByTestId("div_typeDetail");
        this.div_header = this.div_card.getByTestId("div_header");
        this.btn_edit = this.div_card.getByTestId("btn_edit");
        this.btn_save = this.div_card.getByTestId("btn_save");
        this.btn_cancel = this.div_card.getByTestId("btn_cancel");

        this.div_name = this.div_card.getByTestId("div_name");
        this.div_acronym = this.div_card.getByTestId("div_acronym");
        this.div_issuedDefault = this.div_card.getByTestId("div_issuedDefault");
        this.div_usingSizes = this.div_card.getByTestId("div_usingSizes");
        this.div_usingGenerations = this.div_card.getByTestId("div_usingGenerations");
        this.div_defaultSL = this.div_card.getByTestId("div_defaultSL");

        this.txt_name = this.div_card.locator('input[name="name"]');
        this.txt_acronym = this.div_card.locator('input[name="acronym"]');
        this.txt_issuedDefault = this.div_card.locator('input[name="issuedDefault"]');
        this.chk_usingSizes = this.div_card.locator('input[name="usingSizes"]');
        this.chk_usingGenerations = this.div_card.locator('input[name="usingGenerations"]');
        this.sel_defaultSL = this.div_card.locator('select[name="fk_defaultSizeList"]');

        this.err_name = this.div_card.getByTestId("err_name");
        this.err_acronym = this.div_card.getByTestId("err_acronym");
        this.err_issuedDefault = this.div_card.getByTestId("err_issuedDefault");
        this.err_defaultSL = this.div_card.getByTestId("err_defaultSL");
    }
}
