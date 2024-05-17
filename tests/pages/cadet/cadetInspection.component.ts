import { Locator, Page } from "playwright/test";

export class CadetInspectionComponent {
    readonly page: Page;

    readonly div_ci: Locator;
    readonly div_header: Locator;
    readonly btn_inspect: Locator;
    readonly icn_inspected: Locator;

    readonly div_step0_placeholder: Locator;
    readonly div_step0_loading: Locator;
    readonly btn_step1_back: Locator;
    readonly btn_step1_continue: Locator;

    readonly div_step2_unresolvedDefHeader: Locator;
    readonly btn_step2_newDef: Locator;
    readonly div_step2_unifComplete: Locator;
    readonly btn_step2_back: Locator;
    readonly btn_step2_submit: Locator;


    // oldDeficiencyRow
    div_oldDeficiency(deficiencyId: string) {
        return this.div_ci.getByTestId(`div_olddef_${deficiencyId}`);
    }
    chk_olddef_resolved(deficiencyId: string) {
        return this.div_oldDeficiency(deficiencyId).getByTestId("chk_resolved");
    }
    lbl_olddef_resolved(deficiencyId: string) {
        return this.chk_olddef_resolved(deficiencyId).locator('..').locator('label');
    }
    div_olddef_description(deficiencyId: string) {
        return this.div_oldDeficiency(deficiencyId).getByTestId("div_description");
    }
    div_olddef_type(deficiencyId: string) {
        return this.div_oldDeficiency(deficiencyId).getByTestId("div_type");
    }
    div_olddef_created(deficiencyId: string) {
        return this.div_oldDeficiency(deficiencyId).getByTestId("div_created");
    }
    div_olddef_comment(deficiencyId: string) {
        return this.div_oldDeficiency(deficiencyId).getByTestId("div_comment");
    }

    // newDeficiencyRow
    div_newDeficiency(index: number) {
        return this.div_ci.getByTestId(`div_newDef_${index}`);
    }
    // -- fields
    sel_newDef_type(index: number) {
        return this.div_ci.locator(`select[name="newDeficiencyList.${index}.typeId"]`);
    }
    sel_newDef_uniform(index: number) {
        return this.div_ci.locator(`select[name="newDeficiencyList.${index}.fk_uniform"]`);
    }
    sel_newDef_material(index: number) {
        return this.div_ci.locator(`select[name="newDeficiencyList.${index}.materialId"]`);
    }
    sel_newDef_materialGroup(index: number) {
        return this.div_ci.locator(`select[name="newDeficiencyList.${index}.materialGroup"]`);
    }
    sel_newDef_materialType(index: number) {
        return this.div_ci.locator(`select[name="newDeficiencyList.${index}.materialType"]`);
    }
    txt_newDef_description(index: number) {
        return this.div_ci.locator(`input[name="newDeficiencyList.${index}.description"]`);
    }
    txt_newDef_comment(index: number) {
        return this.div_ci.locator(`textarea[name="newDeficiencyList.${index}.comment"]`);
    }
    btn_newDef_delete(index: number) {
        return this.div_newDeficiency(index).getByTestId("btn_delete");
    }
    btn_newDef_delete_mobile(index: number) {
        return this.div_newDeficiency(index).getByTestId("btn_delete_mobile");
    }

    // -- errors
    err_newDef_type(index: number) {
        return this.div_newDeficiency(index).getByTestId("err_type");
    }
    err_newDef_uniform(index: number) {
        return this.div_newDeficiency(index).getByTestId("err_uItem");
    }
    err_newDef_description(index: number) {
        return this.div_newDeficiency(index).getByTestId("err_description");
    }
    err_newDef_comment(index: number) {
        return this.div_newDeficiency(index).getByTestId("err_comment");
    }

    constructor(page: Page) {
        this.page = page;

        this.div_ci = page.getByTestId('div_cadetInspection');
        this.div_header = this.div_ci.getByTestId('div_header');
        this.btn_inspect = this.div_ci.getByTestId('btn_inspect');
        this.icn_inspected = this.btn_inspect.locator('svg');

        this.div_step0_placeholder = this.div_ci.getByTestId("div_step0_noDeficiencies");
        this.div_step0_loading = this.div_ci.getByTestId("div_step0_loading");
        this.btn_step1_back = this.div_ci.getByTestId("btn_step1_back");
        this.btn_step1_continue = this.div_ci.getByTestId("btn_step1_continue");

        this.div_step2_unresolvedDefHeader = this.div_ci.getByTestId("div_step2_oldDefHeader");
        this.btn_step2_newDef = this.div_ci.getByTestId("btn_step2_newDef");
        this.div_step2_unifComplete = this.div_ci.getByTestId("div_step2_unifComplete");
        this.btn_step2_back = this.div_ci.getByTestId("btn_step2_back");
        this.btn_step2_submit = this.div_ci.getByTestId("btn_step2_submit");
    }
}
