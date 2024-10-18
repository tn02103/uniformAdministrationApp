import { Locator, Page } from "playwright/test";
import { CadetDataComponent } from "./cadetData.component";
import { CadetInspectionComponent } from "./cadetInspection.component";
import { CadetMaterialComponent } from "./cadetMaterial.component";
import { CadetUniformComponent } from "./cadetUniform.component";

export class CadetDetailPage {

    readonly page: Page;

    // Page
    readonly divPageHeader: Locator;
    readonly btn_menu: Locator;
    readonly btn_menu_delete: Locator;

    readonly cadetDataComponent: CadetDataComponent;
    readonly cadetUniformComponent: CadetUniformComponent;
    readonly cadetMaterialComponent: CadetMaterialComponent;
    readonly cadetInspectionComponent: CadetInspectionComponent;

    constructor(page: Page) {
        this.page = page;
        this.cadetDataComponent = new CadetDataComponent(page);
        this.cadetUniformComponent = new CadetUniformComponent(page);
        this.cadetMaterialComponent = new CadetMaterialComponent(page);
        this.cadetInspectionComponent = new CadetInspectionComponent(page);

        this.divPageHeader = page.getByTestId("div_pageHeader");
        this.btn_menu = page.getByTestId('btn_cadet_menu');
        this.btn_menu_delete = page.getByTestId('btn_cadet_menu_delete');
    }
}
