import { Locator, Page } from "playwright/test";
import german from "../../../../../public/locales/de";

const t = german.admin.settings.returnProcess;
const tCommon = german.common.actions;

export class ReturnProcessComponent {

    readonly page: Page;

    readonly btn_addTemplate: Locator;
    readonly form_addTemplate: Locator;
    readonly txt_newTemplateName: Locator;
    readonly btn_createTemplate: Locator;
    readonly txt_createSuccess: Locator;

    div_templateCard(templateId: string) {
        return this.page.getByTestId(`div_returnprocess_${templateId}`);
    }

    btn_editTemplateName(templateId: string) {
        return this.div_templateCard(templateId).getByRole('button', { name: 'edit' }).first();
    }

    txt_templateNameInput(templateId: string) {
        return this.div_templateCard(templateId).getByRole('textbox', { name: new RegExp(t.templateName, 'i') });
    }

    btn_saveTemplateName(templateId: string) {
        return this.div_templateCard(templateId).getByRole('button', { name: 'save changes' });
    }

    btn_deleteTemplate(templateId: string) {
        return this.div_templateCard(templateId).getByRole('button', { name: 'delete' });
    }

    btn_expandTemplate(templateId: string, name: string) {
        return this.div_templateCard(templateId).getByRole('button', { name });
    }

    form_addChecklistItem(templateId: string) {
        return this.div_templateCard(templateId).getByRole('form', { name: t.addChecklistItem });
    }

    txt_newChecklistItemLabel(templateId: string) {
        return this.form_addChecklistItem(templateId).getByRole('textbox', { name: new RegExp(t.addItemLabel, 'i') });
    }

    tr_checklistItem(itemId: string) {
        return this.page.getByTestId(`tr_checklistItem_${itemId}`);
    }

    btn_editChecklistItem(itemId: string) {
        return this.tr_checklistItem(itemId).getByRole('button', { name: 'edit' });
    }

    txt_checklistItemLabel(itemId: string) {
        return this.tr_checklistItem(itemId).getByRole('textbox', { name: t.checklistItemLabel });
    }

    btn_saveChecklistItem(itemId: string) {
        return this.tr_checklistItem(itemId).getByRole('button', { name: 'save' });
    }

    btn_deleteChecklistItem(itemId: string) {
        return this.tr_checklistItem(itemId).getByRole('button', { name: 'delete' });
    }

    constructor(page: Page) {
        this.page = page;

        this.btn_addTemplate = page.getByRole('button', { name: t.addTemplate });
        this.form_addTemplate = page.getByRole('form', { name: t.addTemplate });
        this.txt_newTemplateName = this.form_addTemplate.getByRole('textbox', { name: new RegExp(t.templateName, 'i') });
        this.btn_createTemplate = this.form_addTemplate.getByRole('button', { name: tCommon.create });
        this.txt_createSuccess = page.getByText(t.create.success);
    }
}
