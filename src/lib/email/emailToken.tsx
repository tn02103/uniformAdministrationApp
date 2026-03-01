import { User } from "@prisma/client";
import { Html } from "@react-email/html";
import { render } from "@react-email/render";
import { getMailAgend } from "./mailagend";


export const sendTokenViaEmail = async (user: User, token: string) => {
    await getMailAgend().sendMail({
        to: user.email!,
        subject: 'Ihr Verifizierungscode',
        html: await render(emailTokenBody(token)),
    });
}

const emailTokenBody = (token: string) => (
     <Html>
        <h1>Ihr Verifizierungscode</h1>
        <span>Ihr Verifizierungscode lautet: <strong>{token}</strong></span>
        <br />
        <span>Der Code ist 1 Stunde gültig.</span>
     </Html>
);
