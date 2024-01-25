import { Locator, Page } from "playwright/test";

export class TypeListComponent {

    readonly page: Page;

    readonly btn_create: Locator;

    div_type(typeId: string) {
        return this.page.getByTestId(`div_typeList_row_${typeId}`);
    }
    btn_moveUp(typeId: string) {
        return this.div_type(typeId).getByTestId('btn_moveUp');
    }
    btn_moveDown(typeId: string) {
        return this.div_type(typeId).getByTestId('btn_moveDown');
    };
    div_typename(typeId: string) {
        return this.div_type(typeId).getByTestId('div_typename');
    };
    btn_open(typeId: string) {
        return this.div_type(typeId).getByTestId('btn_open');
    };
    btn_delete(typeId: string) {
        return this.div_type(typeId).getByTestId('btn_delete');
    };

    constructor(page: Page) {
        this.page = page;

        this.btn_create = page.getByTestId("btn_type_create");
    }
}
