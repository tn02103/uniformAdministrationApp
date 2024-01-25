import { Locator, Page } from "playwright/test";

export class EditUniformFormComponent {

    readonly page: Page;

    readonly div_component: Locator;
    readonly btn_save: Locator;
    readonly btn_cancel: Locator;

    readonly sel_generation: Locator;
    readonly sel_size: Locator;
    readonly chk_active: Locator;
    readonly txt_comment: Locator;
    readonly err_comment: Locator;


    constructor(page: Page, uniformId: string) {
        this.page = page;

        this.div_component = page.getByTestId(`div_uniformForm_${uniformId}`);
        this.btn_save = this.div_component.getByTestId('btn_save');
        this.btn_cancel = this.div_component.getByTestId('btn_cancel');

        this.sel_generation = this.div_component.locator('select[name="generation"]');
        this.sel_size = this.div_component.locator('select[name="size"]');
        this.chk_active = this.div_component.locator('input[name="active"]');
        this.txt_comment = this.div_component.locator('textarea[name="comment"]');
        this.err_comment = this.div_component.getByTestId('err_comment');
    }
}
