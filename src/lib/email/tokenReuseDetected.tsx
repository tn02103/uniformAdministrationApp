import { Html } from "@react-email/html";
import { render } from "@react-email/render";
import { prisma } from "../db";
import { getScopedI18n } from "../locales/config";
import { getMailAgend } from "./mailagend";

export const sendTokenReuseDetectedEmail = async (userId: string, sendUserEmail: boolean = true) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { organisation: true }
    });
    if (!user) {
        console.error(`sendTokenReuseDetectedEmail: User with id ${userId} not found`);
        return;
    }

    const t = await getScopedI18n("emails.tokenReuseDetected");

    // Send user email only if requested (high-certainty scenarios)
    if (sendUserEmail) {
        try {
            await getMailAgend().sendMail({
                to: user.email,
                subject: t('subject'),
                html: await render(await UserTokenReuseEmailBody({ name: user.name })),
            });
        } catch (error) {
            console.error(`sendTokenReuseDetectedEmail: Failed to send email to user ${user.email}`, error);
        }
    }
    
    // Always send developer notification
    if (process.env.DEVELOPER_NOTIFICATION_EMAILS) {
        try {
            await getMailAgend().sendMail({
                to: process.env.DEVELOPER_NOTIFICATION_EMAILS?.split(","),
                subject: t('developerSubject'),
                html: await render(await DeveloperTokenReuseEmailBody(user.email, sendUserEmail)),
            });
        } catch (error) {
            console.error(`sendTokenReuseDetectedEmail: Failed to send email to developers`, error);
        }
    }
}

const UserTokenReuseEmailBody = async ({ name }: { name: string }) => {
    const t = await getScopedI18n("emails.tokenReuseDetected");
    return (
        <Html>
            <h1>{t("greeting", { name })}</h1>
            <span>{t("line1")}</span><br />
            <span>{t("line2")}</span><br />
            <span>{t("line3")}</span><br />
            <span>{t("line4")}</span><br />
        </Html>
    )
}

const DeveloperTokenReuseEmailBody = async (userEmail: string, userNotified: boolean) => {
    const t = await getScopedI18n("emails.tokenReuseDetected");
    return (
        <Html>
            <h1>{t('developer.heading')}</h1>
            <span>{t('developer.line1', { userEmail })}</span><br />
            <span>{t('developer.line2')}</span><br />
            <span><strong>{t('developer.notificationLabel')}</strong> {userNotified ? t('developer.yes') : t('developer.no')}</span><br />
            <span>{t('developer.line4')}</span><br />
        </Html>
    )
}