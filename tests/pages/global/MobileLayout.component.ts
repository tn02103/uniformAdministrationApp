import { Locator, Page } from "playwright/test";

export class MobileLayoutComponent {

    readonly page: Page;

    readonly div_footer: Locator;
    readonly lnk_home: Locator;
    readonly lnk_cadet: Locator;
    readonly lnk_uniform: Locator;
    readonly lnk_users: Locator;

    readonly div_header: Locator;
    readonly btn_openSidebar: Locator;
    readonly lnk_assosiationName: Locator;
    readonly div_inspection: Locator;


    constructor(page: Page) {
        this.page = page;

        this.div_footer = page.getByTestId('div_layout_footer');
        this.lnk_home = this.div_footer.getByTestId('lnk_home');
        this.lnk_cadet = this.div_footer.getByTestId('lnk_cadet');
        this.lnk_uniform = this.div_footer.getByTestId('lnk_uniform');
        this.lnk_users = this.div_footer.getByTestId('lnk_users');

        this.div_header = page.getByTestId('div_layout_header');
        this.btn_openSidebar = this.div_header.getByTestId('btn_openSidebar');
        this.lnk_assosiationName = this.div_header.getByTestId('lnk_assosiationName');
        this.div_inspection = this.div_header.getByTestId('div_inspection');
    }
}
