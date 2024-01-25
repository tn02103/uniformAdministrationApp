import { Locator, Page } from "playwright/test";

export class CadetUniformComponent {

    readonly page: Page;
    readonly div_typeList: Locator;

    constructor(page: Page) {
        this.page = page;

        this.div_typeList = page.getByTestId('div_uniform_typeList');
    }

    div_utype(typeId: string) {
        return this.page.getByTestId(`div_utype_${typeId}`);
    }
    div_utype_name(typeId: string) {
        return this.div_utype(typeId).getByTestId("div_name");
    }
    div_utype_amount(typeId: string) {
        return this.div_utype(typeId).getByTestId("div_uitems_amount");
    }
    btn_utype_issue(typeId: string) {
        return this.div_utype(typeId).getByTestId("btn_issue");
    }
    div_utype_itemList(typeId: string) {
        return this.div_utype(typeId).getByTestId("div_itemList");
    }


    div_uitem(uniformId: string) {
        return this.page.getByTestId(`div_uitem_${uniformId}`);
    }
    btn_uitem_withdraw(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("btn_withdraw");
    }
    btn_uitem_switch(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("btn_switch");
    }
    btn_uitem_edit(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("btn_edit");
    }
    btn_uitem_menu(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("btn_menu");
    }
    btn_uitem_menu_withdraw(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("btn_menu_withdraw");
    }
    btn_uitem_menu_switch(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("btn_menu_switch");
    }
    btn_uitem_menu_edit(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("btn_menu_edit");
    }

    div_uitem_number(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("div_number");
    }
    div_utiem_generation(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("div_generation");
    }
    div_utiem_size(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("div_size");
    }
    div_utiem_comment(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("div_comment");
    }
}
