import { User } from "@/prisma/client";
import { Html } from "@react-email/html";
import { render } from "@react-email/render";
import { getScopedI18n } from "../locales/config";
import { getMailAgend } from "./mailagend";


export const sendTokenViaEmail = async (user: User, token: string) => {
    const t = await getScopedI18n("emails.emailToken");
    await getMailAgend().sendMail({
        to: user.email!,
        subject: t('subject'),
        html: await render(await emailTokenBody(token)),
    });
}

const emailTokenBody = async (token: string) => {
    const t = await getScopedI18n("emails.emailToken");
    return (
         <Html>
            <h1>{t('heading')}</h1>
            <span>{t('body', { token })}</span>
            <br />
            <span>{t('validity')}</span>
         </Html>
    );
};
