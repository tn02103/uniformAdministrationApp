import { Html } from "@react-email/html";
import { render } from "@react-email/render";
import { AuthRole } from "../AuthRoles";
import { prisma } from "../db";
import { getMailAgend } from "./mailagend";



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
            html: await render(UserBlockedEmailBody()),
        });
    } catch (error) {
        console.error(`sendUserBlockedEmail: Failed to send email to user ${user.email}`, error);
    }
    try {
        await getMailAgend().sendMail({
            to: administrators.map(a => a.email),
            subject: "Ein Benutzerkonto Ihrer Organisation wurde gesperrt",
            html: await render(AdministratorUserBlockedEmailBody(user.email)),
        });
    } catch (error) {
        console.error(`sendUserBlockedEmail: Failed to send email to administrators`, error);
    }
}

const UserBlockedEmailBody = () => {

    return (
        <Html>
            <h1>Ihr UniformAdmin Benutzerkonto wurde gesperrt</h1>
            <span>Ihr Benutzerkonto wurde aufgrund zu vieler fehlgeschlagener Anmeldeversuche gesperrt. <br /></span>
            <span>Bitte wenden Sie sich an Ihren Administrator, um Ihr Konto wieder zu entsperren.</span>
            <span>Sollten Sie nicht versucht haben, sich anzumelden, geben Sie bitte umgehend Bescheid.</span>
        </Html>
    )
}

const AdministratorUserBlockedEmailBody = (userEmail: string) => {
    return (
        <Html>
            <h1>Ein Benutzerkonto Ihrer Organisation wurde gesperrt</h1>
            <span>Das Benutzerkonto {userEmail} wurde aufgrund zu vieler fehlgeschlagener Anmeldeversuche gesperrt.</span>
            <span>Bitte überprüfen Sie die Anmeldeversuche und entsperren Sie das Konto gegebenenfalls wieder.</span>
            <span>Sollten sich diese Nutzer nicht versucht haben anzumelden, geben Sie bitte umgehend Bescheid.</span>
        </Html>
    )
}