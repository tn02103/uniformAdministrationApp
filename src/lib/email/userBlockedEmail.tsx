import { Html } from "@react-email/html";
import { render } from "@react-email/render";
import { AuthRole } from "../AuthRoles";
import { prisma } from "../db";
import { getMailAgend } from "./mailagend";
import { getScopedI18n } from "../locales/config";


export const sendUserBlockedEmail = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { organisation: true }
    });
    if (!user) {
        console.error(`sendUserBlockedEmail: User with id ${userId} not found`);
        return;
    }
    const administrators = await prisma.user.findMany({
        where: {
            organisationId: user.organisationId,
            role: { in: [AuthRole.admin] },
        }
    });

    try {
        await getMailAgend().sendMail({
            to: user.email,
            subject: "Ihr UniformAdmin Benutzerkonto wurde gesperrt",
            html: await render(UserBlockedEmailBody(user.name)),
        });
    } catch (error) {
        console.error(`sendUserBlockedEmail: Failed to send email to user ${user.email}`, error);
    }
    try {
        await getMailAgend().sendMail({
            to: administrators.map(a => a.email),
            subject: "Ein Benutzerkonto Ihrer Organisation wurde gesperrt",
            html: await render(AdministratorUserBlockedEmailBody(user.name)),
        });
    } catch (error) {
        console.error(`sendUserBlockedEmail: Failed to send email to administrators`, error);
    }
}

const UserBlockedEmailBody = async (name: string) => {
    const t = await getScopedI18n("emails.userBlocked.user");
    return (
        <Html>
            <h1>{t('subject')}</h1>
            <span>{t('line1', { name })}</span>
            <span>{t('line2')}</span>
            <span>{t('line3')}</span>
            <span>{t('closing')}</span>
        </Html>
    )
}

const AdministratorUserBlockedEmailBody = async (name: string) => {
    const t = await getScopedI18n("emails.userBlocked.administrator");
    return (
        <Html>
            <h1>{t('subject', {name})}</h1>
            <span>{t('line1')}</span>
            <span>{t('line2', {name})}</span>
            <span>{t('closing')}</span>
        </Html>
    )
}
