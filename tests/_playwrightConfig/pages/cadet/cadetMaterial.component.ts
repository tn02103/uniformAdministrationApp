import { Locator, Page } from "playwright/test";

export class CadetMaterialComponent {

    readonly page: Page;
    readonly div_groupList: Locator;

    div_group(groupId: string) {
        return this.page.getByTestId(`div_matGroup_${groupId}`);
    }
    div_group_name(groupId: string) {
        return this.div_group(groupId).getByTestId("div_groupName");
    }
    btn_group_issue(groupId: string) {
        return this.div_group(groupId).getByTestId("btn_issue");
    }
    div_material(typeId: string) {
        return this.page.getByTestId(`div_material_${typeId}`);
    }
    div_material_name(typeId: string) {
        return this.div_material(typeId).getByTestId("div_name");
    }
    div_material_issued(typeId: string) {
        return this.div_material(typeId).getByTestId("div_issued");
    }
    btn_material_switch(typeId: string) {
        return this.div_material(typeId).getByTestId("btn_switch");
    }
    btn_material_return(typeId: string) {
        return this.div_material(typeId).getByTestId("btn_return");
    }

    constructor(page: Page) {
        this.page = page;
        this.div_groupList = page.getByTestId('div_matGroupList');
    }
}
