import { Locator, Page } from "playwright";

export class DeficiencyTypeAdministrationPage {

    readonly page: Page;

    readonly div_card: Locator;
    readonly div_typeList: Locator;
    readonly btn_create: Locator;

    constructor(page: Page) {
        this.page = page;

        this.div_card = page.getByTestId('div_defTypeCard');
        this.div_typeList = page.locator('tr[data-testid^="div_type_"]');
        this.btn_create = this.div_card.getByTestId('btn_create');
    }
    getRowComponent(id: string) {
        return new DeficiencyTypeRowComponent(this.page, id);
    }
}
class DeficiencyTypeRowComponent {
    readonly id: string;
    readonly page: Page;

    readonly div_row: Locator;
    readonly txt_name: Locator;
    readonly err_name: Locator;
    readonly div_dependent: Locator;
    readonly sel_dependent: Locator;
    readonly div_relation: Locator;
    readonly sel_relation: Locator;
    readonly div_amount_active: Locator;
    readonly div_amount_resolved: Locator;

    readonly btn_edit: Locator;
    readonly btn_delete: Locator;
    readonly btn_reactivate: Locator;
    readonly btn_deactivate: Locator;
    readonly btn_save: Locator;
    readonly btn_cancel: Locator;
    readonly div_disabled: Locator;

    constructor(page: Page, id: string) {
        this.page = page;
        this.id = id;
        this.div_row = page.getByTestId(`div_type_${id}`);
        this.txt_name = this.div_row.locator('input[name="name"]');
        this.err_name = this.div_row.getByTestId('err_name');
        this.div_dependent = this.div_row.getByTestId('div_dependent');
        this.sel_dependent = this.div_row.locator('select[name="dependent"]');
        this.div_relation = this.div_row.getByTestId('div_relation');
        this.sel_relation = this.div_row.locator('select[name="relation"]');

        this.div_amount_active = this.div_row.getByTestId('div_amount_active');
        this.div_amount_resolved = this.div_row.getByTestId('div_amount_resolved');
        this.btn_edit = this.div_row.getByTestId('btn_edit');
        this.btn_delete = this.div_row.getByTestId('btn_delete');
        this.btn_reactivate = this.div_row.getByTestId('btn_reactivate');
        this.btn_deactivate = this.div_row.getByTestId('btn_deactivate');
        this.btn_save = this.div_row.getByTestId('btn_save');
        this.btn_cancel = this.div_row.getByTestId('btn_cancel');
        this.div_disabled = this.div_row.getByTestId('div_disabled');
    }
}