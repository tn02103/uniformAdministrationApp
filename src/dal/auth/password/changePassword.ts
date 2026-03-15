import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export class InvalidCurrentPasswordError extends Error {
    constructor() {
        super("Current password is incorrect");
        this.name = "InvalidCurrentPasswordError";
    }
}

export type ChangePasswordProps = {
    userId: string;
    currentPassword: string;
    newPassword: string;
};

export const changePassword = async ({ userId, currentPassword, newPassword }: ChangePasswordProps): Promise<void> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
    });

    if (!user) {
        throw new Error("User not found");
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
        throw new InvalidCurrentPasswordError();
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedNewPassword,
            changePasswordOnLogin: false,
        },
    });
};
