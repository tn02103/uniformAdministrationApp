import { Locator, Page } from "playwright/test";


export class CadetListPage {

    readonly page: Page;

    readonly div_pageHeader: Locator;
    readonly txt_searchField: Locator;
    readonly btn_clearSerach: Locator;

    readonly tbl_header: Locator;
    readonly btn_hdr_lastname: Locator;
    readonly btn_hdr_firstname: Locator;
    readonly div_hdr_lastInspection: Locator;
    readonly div_hdr_uniformComplete: Locator;
    readonly div_hdr_activeDeficiencies: Locator;


    div_cadet(cadetId: string) {
        return this.page.getByTestId(`div_cadet_${cadetId}`);
    }
    div_cadet_list() {
        return this.page.getByTestId(/div_cadet_/);
    }
    div_cadet_inspection(cadetId: string) {
        return this.div_cadet(cadetId).getByTestId('div_inspection');
    }
    lnk_cadet_lastname(cadetId: string) {
        return this.div_cadet(cadetId).getByTestId('lnk_lastname');
    }
    lnk_cadet_firstname(cadetId: string) {
        return this.div_cadet(cadetId).getByTestId('lnk_firstname');
    }
    div_cadet_lastInspection(cadetId: string) {
        return this.div_cadet(cadetId).getByTestId('div_lastInspection');
    }
    div_cadet_uniformComplete(cadetId: string) {
        return this.div_cadet(cadetId).getByTestId('div_uniformComplete');
    }
    div_cadet_activeDeficiencyCount(cadetId: string) {
        return this.div_cadet(cadetId).getByTestId('div_activeDeficiencyCount');
    }

    constructor(page: Page) {
        this.page = page;

        this.div_pageHeader = page.getByTestId('div_cadetListHeader');
        this.txt_searchField = page.locator('input[name="search"]');
        this.btn_clearSerach = page.getByTestId('btn_clearSearch');

        this.tbl_header = page.getByTestId('tbl_header');
        this.btn_hdr_lastname = this.tbl_header.getByTestId('btn_lastname');
        this.btn_hdr_firstname = this.tbl_header.getByTestId('btn_firstname');
        this.div_hdr_lastInspection = this.tbl_header.getByTestId('div_lastInspection');
        this.div_hdr_uniformComplete = this.tbl_header.getByTestId('div_uniformComplete');
        this.div_hdr_activeDeficiencies = this.tbl_header.getByTestId('div_activeDeficiencies');
    }
}
