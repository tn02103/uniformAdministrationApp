import { Locator, Page } from "playwright/test";

export class SidebarPage {

    readonly page: Page;

    readonly div_sidebar: Locator;
    readonly lnk_header: Locator;
    readonly btn_userDropdown: Locator;
    readonly btn_collapse: Locator;
    readonly btn_logout: Locator;
    readonly div_inspection: Locator;

    readonly lnk_cadetPage: Locator;
    readonly lnk_uniformListPage: Locator;
    readonly lnk_createCadetPage: Locator;
    readonly lnk_createUniformPage: Locator;
    readonly lnk_adminUniformPage: Locator;
    readonly lnk_adminSizePage: Locator;
    readonly lnk_adminMaterialPage: Locator;
    readonly lnk_adminUserPage: Locator;

    readonly btn_createGroup: Locator;
    readonly btn_inspectionGroup: Locator;
    readonly btn_adminGroup: Locator;


    constructor(page: Page) {
        this.page = page;

        this.div_sidebar = page.getByTestId('div_sidebar');
        this.lnk_header = this.div_sidebar.getByTestId('lnk_header');
        this.div_inspection = this.div_sidebar.getByTestId('div_inspection');
        this.btn_collapse = this.div_sidebar.getByTestId('btn_collapse');

        this.lnk_cadetPage = this.div_sidebar.getByTestId('lnk_cadet');
        this.lnk_uniformListPage = this.div_sidebar.getByTestId('lnk_uniformList');
        this.lnk_createCadetPage = this.div_sidebar.getByTestId('lnk_createCadet');
        this.lnk_createUniformPage = this.div_sidebar.getByTestId('lnk_createUniform');
        this.lnk_adminUniformPage = this.div_sidebar.getByTestId('lnk_adminUniform');
        this.lnk_adminSizePage = this.div_sidebar.getByTestId('lnk_adminUniformSize');
        this.lnk_adminMaterialPage = this.div_sidebar.getByTestId('lnk_adminMaterial');
        this.lnk_adminUserPage = this.div_sidebar.getByTestId('lnk_users');

        this.btn_createGroup = this.div_sidebar.getByTestId('btn_createGroup');
        this.btn_inspectionGroup = this.div_sidebar.getByTestId('btn_inspectionGroup');
        this.btn_adminGroup = this.div_sidebar.getByTestId('btn_adminGroup');

        this.btn_userDropdown = page.getByTestId('btn_user_dropdown');
        this.btn_logout = page.getByTestId('btn_logout');
    }
}
