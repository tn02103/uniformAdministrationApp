import { Page } from "playwright/test";

export class SizelistListComponent {

    readonly page: Page;

    readonly btn_create;

    div_sizelist(sizelistId: string) {
        return this.page.getByTestId(`div_sizelist_list_${sizelistId}`);
    }
    div_sizelist_name(sizelistId: string) {
        return this.div_sizelist(sizelistId).getByTestId("div_name");
    }
    btn_sizelist_select(sizelistId: string) {
        return this.div_sizelist(sizelistId).getByTestId("btn_select");
    }

    constructor(page: Page) {
        this.page = page;

        this.btn_create = page.getByTestId("btn_sizelist_create");
    }
}
