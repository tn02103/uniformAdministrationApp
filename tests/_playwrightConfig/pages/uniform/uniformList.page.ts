import { Locator, Page } from "playwright/test";


export class UniformListPage {

    readonly page: Page;

    readonly div_pageHeader: Locator;
    readonly sel_type: Locator;
    readonly btn_load: Locator;

    readonly err_search_invalidInput: Locator;
    readonly div_search_helptext: Locator;
    readonly txt_search_input: Locator;
    readonly btn_search_submit: Locator;

    readonly div_genAccordion: Locator;
    readonly btn_genAccordion_header: Locator;
    readonly chk_genFilter_nullValue: Locator;
    readonly chk_genFilter_selAll: Locator;
    chk_genFilter(generationId: string) {
        return this.page.locator(`input[name="generations.${generationId}"]`);
    }
    readonly div_sizeAccordion: Locator;
    readonly btn_sizeAccordion_header: Locator;
    readonly chk_sizeFilter_nullValue: Locator;
    readonly chk_sizeFilter_selAll: Locator;
    chk_sizeFilter(sizeId: string) {
        return this.page.locator(`input[name="sizes.${sizeId}"]`);
    }

    readonly div_othersAccordion: Locator;
    readonly btn_othersAccordion_header: Locator;
    readonly chk_activeFilter: Locator;
    readonly chk_isReserveFilter: Locator;
    readonly chk_issuedFilter: Locator;
    readonly chk_notIssuedFilter: Locator;
    readonly chk_inStorageUnitFilter: Locator;
    readonly err_filter: Locator;

    readonly div_header_number: Locator;
    readonly div_header_size: Locator;
    readonly div_header_generation: Locator;
    readonly div_header_owner: Locator;
    readonly div_header_comment: Locator;
    readonly div_header_count: Locator;

    readonly div_uitem_list: Locator;
    readonly div_nodata: Locator;
    div_uitem(uniformId: string) {
        return this.page.getByTestId(`div_uitem_${uniformId}`);
    }
    div_uitem_number(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("div_number");
    }
    div_uitem_reserveLabel(uniformId: string) {
        return this.div_uitem_number(uniformId).locator('span[class^="badge"]');
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
    btn_uitem_open(uniformId: string) {
        return this.div_uitem(uniformId).getByTestId("btn_open");
    }
 
   
    constructor(page: Page) {
        this.page = page;
        this.div_pageHeader = page.getByTestId("div_pageHeader");
        this.sel_type = page.getByTestId("sel_type");
        this.btn_load = page.getByTestId("btn_load");

        this.err_search_invalidInput = page.getByTestId('err_search_invalidInput');
        this.div_search_helptext = page.getByTestId('div_search_helptext');
        this.txt_search_input = page.locator('input[name="search"]');
        this.btn_search_submit = page.getByTestId('btn_search_submit');

        this.div_genAccordion = page.getByTestId("div_genAccordion");
        this.btn_genAccordion_header = this.div_genAccordion.getByRole('button');
        this.chk_genFilter_nullValue = this.page.locator(`input[name="generations.null"]`);
        this.chk_genFilter_selAll = this.page.locator(`input[name="all.generations"]`);
        this.div_sizeAccordion = page.getByTestId("div_sizeAccordion");
        this.btn_sizeAccordion_header = this.div_sizeAccordion.getByRole('button');
        this.chk_sizeFilter_nullValue = this.page.locator(`input[name="sizes.null"]`);
        this.chk_sizeFilter_selAll = this.page.locator(`input[name="all.sizes"]`);

        this.div_othersAccordion = page.getByTestId("div_othersAccordion");
        this.btn_othersAccordion_header = this.div_othersAccordion.getByRole('button');
        this.chk_activeFilter = page.locator('input[name="active"]');
        this.chk_isReserveFilter = page.locator('input[name="isReserve"]');
        this.chk_issuedFilter = page.locator('input[name="issued"]');
        this.chk_notIssuedFilter = page.locator('input[name="notIssued"]');
        this.chk_inStorageUnitFilter = page.locator('input[name="inStorageUnit"]');
        this.err_filter = page.getByTestId('err_filterError');

        this.div_header_number = page.getByTestId("btn_header_number");
        this.div_header_size = page.getByTestId("btn_header_size");
        this.div_header_generation = page.getByTestId("btn_header_generation");
        this.div_header_owner = page.getByTestId("btn_header_owner");
        this.div_header_comment = page.getByTestId("btn_header_comment");
        this.div_header_count = page.getByTestId("div_header_count");

        this.div_uitem_list = page.locator('tr[data-testid^="div_uitem_"]');
        this.div_nodata = page.getByTestId('div_nodata');
    }
}
