import { Locator, Page } from "playwright/test";


export class UniformListPage {

    readonly page: Page;

    readonly div_pageHeader: Locator;
    readonly sel_type: Locator;
    readonly btn_load: Locator;

    readonly div_genAccordion: Locator;
    readonly btn_genAccordion_header: Locator;
    chk_genFilter(generationId: string) {
        return this.page.locator(`input[name="generations.${generationId}"]`);
    }
    readonly div_sizeAccordion: Locator;
    readonly btn_sizeAccordion_header: Locator;
    chk_sizeFilter(sizeId: string) {
        return this.page.locator(`input[name="sizes.${sizeId}"]`);
    }

    readonly div_othersAccordion: Locator;
    readonly btn_othersAccordion_header: Locator;
    readonly chk_activeFilter: Locator;
    readonly chk_passiveFilter: Locator;
    readonly chk_withOwnerFilter: Locator;
    readonly chk_withoutOwnerFilter: Locator;
    readonly err_filter: Locator;

    readonly div_header_number: Locator;
    readonly div_header_size: Locator;
    readonly div_header_generation: Locator;
    readonly div_header_owner: Locator;
    readonly div_header_comment: Locator;
    readonly div_header_count: Locator;

    div_uitem(uniformId: string) {
        return this.page.getByTestId(`div_uitem_${uniformId}`);
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
    lnk_uitem_owner(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("lnk_owner");
    }
    div_uitem_comment(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("div_comment");
    }
    btn_uitem_showDetailRow(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("btn_showDetailRow");
    }
    btn_uitem_edit(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("btn_edit");
    }

    div_uitem_detail(uniformId: string) {
        return this.page.getByTestId(`div_detailRow_${uniformId}`);
    }
    div_uitem_detail_active(uniformId: string) {
        return this.div_uitem_detail(uniformId).getByTestId("div_active");
    }
    div_uitem_detail_comment(uniformId: string) {
        return this.div_uitem_detail(uniformId).getByTestId("div_comment");
    }
    lnk_uitem_detail_owner(uniformId: string) {
        return this.div_uitem_detail(uniformId).getByTestId("lnk_owner");
    }
    btn_uitem_detail_edit(uniformId: string) {
        return this.div_uitem_detail(uniformId).getByTestId("btn_edit");
    }

    div_uForm(uniformId: string) {
        return this.page.getByTestId(`div_uniformForm_${uniformId}`);
    }
    btn_uForm_save(uniformId: string) {
        return this.div_uForm(uniformId).getByTestId("btn_form_save");
    }
    btn_uForm_cancel(uniformId: string) {
        return this.div_uForm(uniformId).getByTestId("btn_form_cancel");
    }
    sel_uForm_generation(uniformId: string) {
        return this.div_uForm(uniformId).locator(`select[name="generation"]`);
    }
    sel_uForm_size(uniformId: string) {
        return this.div_uForm(uniformId).locator(`select[name="size"]`);
    }
    chk_uForm_active(uniformId: string) {
        return this.div_uForm(uniformId).locator(`input[name="active"]`);
    }
    txt_uForm_comment(uniformId: string) {
        return this.div_uForm(uniformId).locator(`textarea[name="comment"]`);
    }

    constructor(page: Page) {
        this.page = page;
        this.div_pageHeader = page.getByTestId("div_pageHeader");
        this.sel_type = page.getByTestId("sel_type");
        this.btn_load = page.getByTestId("btn_load");

        this.div_genAccordion = page.getByTestId("div_genAccordion");
        this.btn_genAccordion_header = this.div_genAccordion.getByRole('button', { name: 'Generationen' });
        this.div_sizeAccordion = page.getByTestId("div_sizeAccordion");
        this.btn_sizeAccordion_header = this.div_sizeAccordion.getByRole('button', { name: 'Größen' });

        this.div_othersAccordion = page.getByTestId("div_othersAccordion");
        this.btn_othersAccordion_header = this.div_othersAccordion.getByRole('button', { name: 'Sonstige' });
        this.chk_activeFilter = page.locator('input[name="active"]');
        this.chk_passiveFilter = page.locator('input[name="passive"]');
        this.chk_withOwnerFilter = page.locator('input[name="withOwner"]');
        this.chk_withoutOwnerFilter = page.locator('input[name="withoutOwner"]');
        this.err_filter = page.getByTestId('err_filterError');

        this.div_header_number = page.getByTestId("btn_header_number");
        this.div_header_size = page.getByTestId("btn_header_size");
        this.div_header_generation = page.getByTestId("btn_header_generation");
        this.div_header_owner = page.getByTestId("btn_header_owner");
        this.div_header_comment = page.getByTestId("btn_header_comment");
        this.div_header_count = page.getByTestId("div_header_count");
    }
}
