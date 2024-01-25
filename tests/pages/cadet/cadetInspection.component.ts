import { Locator, Page } from "playwright/test";
import { prisma } from "../../../src/lib/db";
import { testAssosiation } from "../../testData/staticData";
import { inspect } from "util";

export class CadetInspectionComponent {
    readonly page: Page;

    readonly div_ci: Locator;
    readonly div_header: Locator;
    readonly btn_inspect: Locator;

    readonly div_step0_placeholder: Locator;
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
        return this.div_ci.locator(`select[name="newDeficiencyList.${index}.deficiencyType.id"]`);
    }
    sel_newDef_uniform(index: number) {
        return this.div_ci.locator(`select[name="newDeficiencyList.${index}.uniformId"]`);
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

        this.div_step0_placeholder = this.div_ci.getByTestId("div_step0_noDeficiencies");
        this.btn_step1_back = this.div_ci.getByTestId("btn_step1_back");
        this.btn_step1_continue = this.div_ci.getByTestId("btn_step1_continue");

        this.div_step2_unresolvedDefHeader = this.div_ci.getByTestId("div_step2_oldDefHeader");
        this.btn_step2_newDef = this.div_ci.getByTestId("btn_step2_newDef");
        this.div_step2_unifComplete = this.div_ci.getByTestId("div_step2_unifComplete");
        this.btn_step2_back = this.div_ci.getByTestId("btn_step2_back");
        this.btn_step2_submit = this.div_ci.getByTestId("btn_step2_submit");
    }

    readonly testInspection = {
        id: "855823c4-5478-11ee-b196-0068eb8ba754",
        fk_assosiation: testAssosiation.id,
    }
    readonly testInspectionSvenKeller = {
        id: 'c4d33a71-9283-11ee-8084-0068eb8ba754',
        fk_cadet: 'c4d33a71-3c11-11ee-8084-0068eb8ba754',
        fk_inspection: this.testInspection.id,
        uniformComplete: false,
        cadetDeficiency: {
            createMany: {
                data: [
                    {
                        id: 'c4d33a71-1334-11ee-8084-0068eb8ba754',
                        fk_deficiencyType: '4ae2c897-3dcf-11ee-ac41-0068eb8ba754',
                        description: 'Typ1-1146',
                        comment: "New Deficiency 1",
                        fk_cadet: 'c4d33a71-3c11-11ee-8084-0068eb8ba754',
                    }
                ]
            }
        }
    }
    readonly testSvenKellerDeficienciesToResolve = ["09868976-3dcf-11ee-ac41-0068eb8ba754", "ccffb98b-3dcf-11ee-ac41-0068eb8ba754"];

    async startInspection() {
        await prisma.inspection.create({
            data: this.testInspection,
        });
        await this.page.reload();
    }

    async insertSvenKellerFirstInspection() {
        await prisma.cadetDeficiency.updateMany({
            where: {
                id: { in: this.testSvenKellerDeficienciesToResolve }
            },
            data: {
                dateResolved: new Date(),
            }
        });

        await prisma.cadetInspection.create({
            data: {
                ...this.testInspectionSvenKeller,
            }
        });
    }
}
