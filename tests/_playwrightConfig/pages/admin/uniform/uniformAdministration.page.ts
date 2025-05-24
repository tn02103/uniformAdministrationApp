import { Page } from "playwright/test";
import { GenerationListComponent } from "./GenerationList.component";
import { SizelistDetailComponent } from "./SizelistDetail.component";
import { SizelistListComponent } from "./SizelistList.component";
import { TypeDetailComponent } from "./typeDetail.component";
import { TypeListComponent } from "./typeList.component";

export class UniformAdministrationPage {

    readonly page: Page;

    readonly typeListComponent: TypeListComponent;
    readonly typeDetailComponent: TypeDetailComponent;
    readonly generationListComponent: GenerationListComponent;
    readonly sizelistListComponent: SizelistListComponent;
    readonly sizelistDetailComponent: SizelistDetailComponent

    constructor(page: Page) {
        this.page = page;

        this.typeListComponent = new TypeListComponent(page);
        this.typeDetailComponent = new TypeDetailComponent(page);
        this.generationListComponent = new GenerationListComponent(page);
        this.sizelistListComponent = new SizelistListComponent(page);
        this.sizelistDetailComponent = new SizelistDetailComponent(page);
    }
}
