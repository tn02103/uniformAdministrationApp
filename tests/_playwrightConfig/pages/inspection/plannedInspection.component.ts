import { Locator, Page } from "playwright";

export class PlannedInspectionTestComponent {

    readonly page: Page;
    readonly div_table: Locator;
    readonly btn_add: Locator;
    readonly div_row_list: Locator;

    constructor(page: Page) {
        this.page = page;
        this.div_table = page.getByTestId('div_plannedTable');
        this.btn_add = this.div_table.getByTestId('btn_add');
        this.div_row_list = this.div_table.locator('div[data-testid^="div_inspection"]');
    }

    getRowComponent(id: string) {
        return new PlannedInspectionRowComponent(id, this.div_table);
    }
    div_row(id: string) {
        return this.div_table.getByTestId(`div_inspection_${id}`);
    }
}

class PlannedInspectionRowComponent {
    readonly id: string;
    readonly div_row: Locator;

    readonly lbl_expired: Locator;
    readonly lbl_active: Locator;
    readonly lbl_new: Locator;
    readonly lbl_notCompleted: Locator;
    readonly lbl_planned: Locator;
    readonly lbl_completed: Locator;

    readonly div_date: Locator;
    readonly txt_date: Locator;
    readonly div_name: Locator;
    readonly txt_name: Locator;


    readonly btn_edit: Locator;
    readonly btn_delete: Locator;
    readonly btn_save: Locator;
    readonly btn_cancel: Locator;
    readonly btn_complete: Locator;
    readonly btn_start: Locator;


    constructor(id: string, div_table: Locator) {
        this.id = id;
        this.div_row = div_table.getByTestId(`div_inspection_${id}`);

        this.lbl_expired = this.div_row.getByTestId('lbl_expired');
        this.lbl_active = this.div_row.getByTestId('lbl_active');
        this.lbl_new = this.div_row.getByTestId('lbl_new');
        this.lbl_notCompleted = this.div_row.getByTestId('lbl_notCompleted');
        this.lbl_planned = this.div_row.getByTestId('lbl_planned');
        this.lbl_completed = this.div_row.getByTestId('lbl_completed');

        this.div_date = this.div_row.getByTestId('div_date');
        this.txt_date = this.div_row.locator('input[name="date"]');
        this.div_name = this.div_row.getByTestId('div_name');
        this.txt_name = this.div_row.locator('input[name="name"]');

        this.btn_edit = this.div_row.getByTestId('btn_edit');
        this.btn_delete = this.div_row.getByTestId('btn_delete');
        this.btn_save = this.div_row.getByTestId('btn_save');
        this.btn_cancel = this.div_row.getByTestId('btn_cancel');
        this.btn_complete = this.div_row.getByTestId('btn_complete');
        this.btn_start = this.div_row.getByTestId('btn_start');
    }
}