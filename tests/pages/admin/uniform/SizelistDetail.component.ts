import { Locator, Page } from "playwright/test";

export class SizelistDetailComponent {
    readonly page: Page;

    readonly div_card: Locator;
    readonly div_header: Locator;

    readonly btn_menu: Locator;
    readonly btn_menu_edit: Locator;
    readonly btn_menu_delete: Locator;
    readonly btn_menu_rename: Locator;

    readonly btn_cancel: Locator;
    readonly btn_save: Locator;

    btn_selectedSize(sizeId: string) {
        return this.div_card.getByTestId(`btn_selectedSize_${sizeId}`);
    }
    div_selectedSize(sizeId: string) {
        return this.div_card.getByTestId(`div_selectedSize_${sizeId}`);
    }
    btn_backupSize(sizeId: string) {
        return this.div_card.getByTestId(`btn_backupSize_${sizeId}`);
    }

    constructor(page: Page) {
        this.page = page;

        this.div_card = page.getByTestId('div_sizelist_detail');
        this.div_header = this.div_card.getByTestId('div_header');

        this.btn_menu = this.div_card.getByTestId('btn_menu');
        this.btn_menu_edit = this.div_card.getByTestId('btn_menu_edit');
        this.btn_menu_delete = this.div_card.getByTestId('btn_menu_delete');
        this.btn_menu_rename = this.div_card.getByTestId('btn_menu_rename');

        this.btn_cancel = this.div_card.getByTestId('btn_cancel');
        this.btn_save = this.div_card.getByTestId('btn_save');
    }
}
