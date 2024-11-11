import { Locator, Page } from "playwright/test";

export class MaterialGroupListComponent {

    readonly page: Page;

    readonly btn_create: Locator;

    div_mGroup(groupId: string) {
        return this.page.getByTestId(`div_mGroup_row_${groupId}`);
    }
    btn_mGroup_moveUp(groupId: string) {
        return this.div_mGroup(groupId).getByTestId('btn_moveUp');
    }
    btn_mGroup_moveDown(groupId: string) {
        return this.div_mGroup(groupId).getByTestId('btn_moveDown');
    }
    div_mGroup_name(groupId: string) {
        return this.div_mGroup(groupId).getByTestId('div_name');
    }
    btn_mGroup_select(groupId: string) {
        return this.div_mGroup(groupId).getByTestId('btn_open');
    }

    constructor(page: Page) {
        this.page = page;

        this.btn_create = page.getByTestId('btn_mGroup_create');
    }
}
