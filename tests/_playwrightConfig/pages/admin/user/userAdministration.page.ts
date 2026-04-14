import { Locator, Page } from "playwright/test";
import german from "../../../../../public/locales/de";
import { DangerConfirmationModal } from "../../popups/DangerConfirmationPopup.component";
import { MessagePopupComponent } from "../../popups/MessagePopup.component";

const t = german;

export class UserAdministrationPage {
    readonly page: Page;
    readonly dangerModal: DangerConfirmationModal;
    readonly messageModal: MessagePopupComponent;

    // Table
    readonly table: Locator;
    readonly btn_create: Locator;

    // Offcanvas panel (.offcanvas scopes to Bootstrap Offcanvas only, not Bootstrap Modal)
    readonly offcanvas: Locator;
    readonly oc_heading_create: Locator;

    // Offcanvas inputs — use input[name=] attribute selectors to avoid label-substring ambiguity
    // (getByRole('textbox', { name: 'Name' }) would also match 'Nutzername')
    readonly oc_inp_name: Locator;
    readonly oc_inp_username: Locator;
    readonly oc_inp_email: Locator;

    // Offcanvas action buttons
    readonly oc_btn_create: Locator;
    readonly oc_btn_save: Locator;
    readonly oc_btn_cancel: Locator;
    readonly oc_btn_edit: Locator;
    readonly oc_btn_delete: Locator;
    readonly oc_btn_resetPassword: Locator;

    // Offcanvas field-level error messages
    readonly oc_err_username: Locator;
    readonly oc_err_email: Locator;

    constructor(page: Page) {
        this.page = page;
        this.dangerModal = new DangerConfirmationModal(page);
        this.messageModal = new MessagePopupComponent(page);

        this.table = page.getByRole('table', { name: t.admin.user.header.page });
        this.btn_create = this.table.getByRole('button', { name: 'create' });

        this.offcanvas = page.locator('.offcanvas');
        this.oc_heading_create = this.offcanvas.getByRole('heading', { name: t.common.actions.create });

        this.oc_inp_name     = this.offcanvas.locator('input[name="name"]');
        this.oc_inp_username = this.offcanvas.locator('input[name="username"]');
        this.oc_inp_email    = this.offcanvas.locator('input[name="email"]');

        this.oc_btn_create = this.offcanvas.getByRole('button', { name: t.common.actions.create });
        this.oc_btn_save   = this.offcanvas.getByRole('button', { name: t.common.actions.save });
        this.oc_btn_cancel = this.offcanvas.getByRole('button', { name: t.common.actions.cancel });
        this.oc_btn_edit   = this.offcanvas.getByRole('button', { name: t.common.actions.edit });
        this.oc_btn_delete = this.offcanvas.getByRole('button', { name: t.common.actions.delete });
        this.oc_btn_resetPassword = this.offcanvas.getByRole('button', { name: t.admin.user.actions.resetPassword });

        this.oc_err_username = this.offcanvas.getByTestId('err_username');
        this.oc_err_email    = this.offcanvas.getByTestId('err_email');
    }

    userRow(username: string): Locator {
        return this.table.getByRole('row', { name: `user: ${username}` });
    }

    btn_openUser(username: string): Locator {
        return this.userRow(username).getByRole('button', { name: 'open' });
    }

    /** Locator for the offcanvas heading showing the current user's name (view/edit mode). */
    oc_heading(name: string): Locator {
        return this.offcanvas.getByRole('heading', { name });
    }
}
