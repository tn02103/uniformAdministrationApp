import { Page } from "playwright/test";
import { MaterialGroupListComponent } from "./MaterialGroupList.component";
import { MaterialGroupDetailComponent } from "./MaterialGroupDetail.components";
import { MaterialListComponent } from "./MaterialList.component";

export class MaterialAdministrationPage {

    readonly page: Page;

    readonly materialGroupListComponent: MaterialGroupListComponent;
    readonly materialGroupDetailComponent: MaterialGroupDetailComponent;
    readonly materialListComponent: MaterialListComponent;

    constructor(page: Page) {
        this.page = page;

        this.materialGroupListComponent = new MaterialGroupListComponent(this.page);
        this.materialGroupDetailComponent = new MaterialGroupDetailComponent(this.page);
        this.materialListComponent = new MaterialListComponent(this.page);
    }
}
