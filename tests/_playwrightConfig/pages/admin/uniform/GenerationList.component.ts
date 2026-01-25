import { Locator, Page } from "playwright/test";

export class GenerationListComponent {
    readonly page: Page;

    readonly btn_create: Locator;

    div_generation(generationId: string) {
        return this.page.getByTestId(`div_generation_${generationId}`);
    }
    btn_gen_moveUp(generationId: string) {
        return this.div_generation(generationId).getByTestId('btn_moveUp');
    }
    btn_gen_moveDown(generationId: string) {
        return this.div_generation(generationId).getByTestId('btn_moveDown');
    }
    div_gen_name(generationId: string) {
        return this.div_generation(generationId).getByTestId('div_name');
    }
    div_gen_reserve(generationId: string) {
        return this.div_generation(generationId).getByTestId('div_reserve');
    }
    div_gen_sizelist(generationId: string) {
        return this.div_generation(generationId).getByTestId('div_sizelist');
    }
    btn_gen_edit(generationId: string) {
        return this.div_generation(generationId).getByTestId('btn_edit');
    }
    btn_gen_delete(generationId: string) {
        return this.div_generation(generationId).getByTestId('btn_delete');
    }

    constructor(page: Page) {
        this.page = page;

        this.btn_create = page.getByTestId('btn_generation_create');
    }
}
