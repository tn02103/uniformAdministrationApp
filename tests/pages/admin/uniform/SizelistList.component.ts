import { Page } from "playwright/test";

export class SizelistListComponent {

    readonly page: Page;

    readonly btn_create;

    div_sizeList(sizelistId: string) {
        return this.page.getByTestId(`div_sizelist_list_${sizelistId}`);
    }
    div_sizeList_name(sizelistId: string) {
        return this.div_sizeList(sizelistId).getByTestId("div_name");
    }
    btn_sizeList_select(sizelistId: string) {
        return this.div_sizeList(sizelistId).getByTestId("btn_select");
    }

    constructor(page: Page) {
        this.page = page;

        this.btn_create = page.getByTestId("btn_sizelist_create");
    }
}
