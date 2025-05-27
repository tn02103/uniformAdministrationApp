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
    btn_uitem_open(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("btn_open");
    }
    btn_uitem_edit(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("btn_edit");
    }
    btn_uitem_save(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("btn_save");
    }
    btn_uitem_cancel(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("btn_cancel");
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
    btn_uitem_menu_open(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("btn_menu_open");
    }

    div_uitem_number(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("div_number");
    }
    div_uitem_generation(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("div_generation");
    }
    div_uitem_size(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("div_size");
    }
    div_uitem_comment(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("div_comment");
    }

    sel_uitem_generation(uniformId: string) {
        return this.div_uitem(uniformId).locator('select[name="generation"]');
    }
    sel_uitem_size(uniformId: string) {
        return this.div_uitem(uniformId).locator('select[name="size"]');
    }
    txt_uitem_comment(uniformId: string) {
        return this.div_uitem(uniformId).locator('textarea[name="comment"]');
    }


}

export class UniformItemRowComponent {
    readonly page: Page;
    readonly uniformId: string;

    readonly comp: CadetUniformComponent;

    readonly div_uitem: Locator;
    readonly btn_withdraw: Locator;
    readonly btn_switch: Locator;
    readonly btn_open: Locator;
    readonly btn_edit: Locator;
    readonly btn_save: Locator;
    readonly btn_cancel: Locator;
    readonly btn_menu: Locator;
    readonly btn_menu_withdraw: Locator;
    readonly btn_menu_switch: Locator;
    readonly btn_menu_open: Locator;




    readonly div_number: Locator
    readonly div_generation: Locator;
    readonly div_size: Locator;
    readonly div_comment: Locator;

    readonly sel_generation: Locator;
    readonly sel_size: Locator;
    readonly txt_comment: Locator;

    constructor(page: Page, uniformId: string) {
        this.page = page;
        this.uniformId = uniformId;

        this.comp = new CadetUniformComponent(page);

        this.div_uitem = this.comp.div_uitem(this.uniformId);
        this.btn_withdraw = this.comp.btn_uitem_withdraw(this.uniformId);
        this.btn_switch = this.comp.btn_uitem_switch(this.uniformId);
        this.btn_open = this.comp.btn_uitem_open(this.uniformId);
        this.btn_edit = this.comp.btn_uitem_edit(this.uniformId);
        this.btn_save = this.comp.btn_uitem_save(this.uniformId);
        this.btn_cancel = this.comp.btn_uitem_cancel(this.uniformId);
        this.btn_menu = this.comp.btn_uitem_menu(this.uniformId);
        this.btn_menu_withdraw = this.comp.btn_uitem_withdraw(this.uniformId);
        this.btn_menu_switch = this.comp.btn_uitem_menu_switch(this.uniformId);
        this.btn_menu_open = this.comp.btn_uitem_menu_open(this.uniformId);

        this.div_number = this.comp.div_uitem_number(this.uniformId);
        this.div_generation = this.comp.div_uitem_generation(this.uniformId);
        this.div_size = this.comp.div_uitem_size(this.uniformId);
        this.div_comment = this.comp.div_uitem_comment(this.uniformId);

        this.sel_generation = this.comp.sel_uitem_generation(this.uniformId);
        this.sel_size = this.comp.sel_uitem_size(this.uniformId);
        this.txt_comment = this.comp.txt_uitem_comment(this.uniformId);
    }
}