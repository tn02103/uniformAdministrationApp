import { Page } from "playwright/test";
import { AnonymizationConfigComponent } from "./AnonymizationConfig.component";
import { ResignationProcessComponent } from "./ResignationProcess.component";

export class SettingsPage {

    readonly page: Page;

    readonly anonymizationConfig: AnonymizationConfigComponent;
    readonly resignationProcess: ResignationProcessComponent;

    static readonly url = '/de/app/admin/settings';

    constructor(page: Page) {
        this.page = page;
        this.anonymizationConfig = new AnonymizationConfigComponent(page);
        this.resignationProcess = new ResignationProcessComponent(page);
    }

    async goto() {
        await this.page.goto(SettingsPage.url);
    }
}
