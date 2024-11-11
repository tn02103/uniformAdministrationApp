import { Locator, Page } from "playwright/test";

export class MaterialListComponent {

    readonly page: Page;

    readonly btn_create: Locator;

    div_material(materialId: string) {
        return this.page.getByTestId(`div_material_${materialId}`);
    }
    btn_material_moveUp(materialId: string) {
        return this.div_material(materialId).getByTestId('btn_moveUp');
    }
    btn_material_moveDown(materialId: string) {
        return this.div_material(materialId).getByTestId('btn_moveDown');
    }
    div_material_name(materialId: string) {
        return this.div_material(materialId).getByTestId('div_typename');
    }
    div_material_actualQuantity(materialId: string) {
        return this.div_material(materialId).getByTestId('div_actualQuantity');
    }
    div_material_targetQuantity(materialId: string) {
        return this.div_material(materialId).getByTestId('div_targetQuantity');
    }
    div_material_issuedQuantity(materialId: string) {
        return this.div_material(materialId).getByTestId('div_issuedQuantity');
    }
    btn_material_edit(materialId: string) {
        return this.div_material(materialId).getByTestId('btn_edit');
    }
    btn_material_delete(materialId: string) {
        return this.div_material(materialId).getByTestId('btn_delete');
    }

    constructor(page: Page) {
        this.page = page;

        this.btn_create = page.getByTestId('btn_material_create');
    }
}
