import { Locator, Page } from "playwright";
import { CreateUniformConfiguratorComponent } from "./configurator.component";
import { NubmerInputComponent } from "./numberInput.component";
import GenerateStep1Component from "./generate.step1.component";
import GenerateStep2Component from "./generate.step2.component";


export class CreateUniformPage {
    readonly page: Page;

    readonly btn_tab_knownIds: Locator;
    readonly btn_tab_generateIds: Locator;

    readonly configurator: CreateUniformConfiguratorComponent;
    readonly numberInput: NubmerInputComponent;

    readonly generateStep1: GenerateStep1Component;
    readonly generateStep2: GenerateStep2Component;

    constructor(page: Page) {
        this.page = page;

        this.btn_tab_generateIds = page.getByTestId('btn_tab_generateIds');
        this.btn_tab_knownIds = page.getByTestId('btn_tab_knownIds');

        this.configurator = new CreateUniformConfiguratorComponent(page);
        this.numberInput = new NubmerInputComponent(page);
        this.generateStep1 = new GenerateStep1Component(page);
        this.generateStep2 = new GenerateStep2Component(page);
    }
}
