import { Locator, Page } from "playwright/test";

export class UniformSizeAdministrationPage {

    readonly page: Page;

    readonly btn_create: Locator;

    div_size(sizeId: string) {
        return this.page.getByTestId(`div_size_${sizeId}`);
    }
    btn_moveUp(sizeId: string) {
        return this.div_size(sizeId).getByTestId('btn_moveUp');
    }
    btn_moveDown(sizeId: string) {
        return this.div_size(sizeId).getByTestId('btn_moveDown');
    }
    div_index(sizeId: string) {
        return this.div_size(sizeId).getByTestId('div_index');
    }
    div_name(sizeId: string) {
        return this.div_size(sizeId).getByTestId('div_name');
    }
    btn_menu(sizeId: string) {
        return this.div_size(sizeId).getByTestId('btn_menu');
    }
    btn_menu_setPosition(sizeId: string) {
        return this.div_size(sizeId).getByTestId('btn_menu_setPosition');
    }
    btn_menu_delete(sizeId: string) {
        return this.div_size(sizeId).getByTestId('btn_menu_delete');
    }

    constructor(page: Page) {
        this.page = page;

        this.btn_create = page.getByTestId('btn_create')
    }
}
