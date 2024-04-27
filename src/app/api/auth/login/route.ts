'use server';

import { prisma } from "@/lib/db";
import { IronSessionUser, getIronSession } from "@/lib/ironSession";
import { userNameValidationPattern, uuidValidationPattern } from "@/lib/validations";
import bcrypt from 'bcrypt';
import { NextResponse } from "next/server";
const crypto = require("crypto");
var jwt = require('jsonwebtoken');

export async function POST(request: Request) {
    const session = await getIronSession();
    try {
        const { username, assosiation, deviceId, password } = await request.json();
        // validate BODY
        if (!userNameValidationPattern.test(username)
            || !uuidValidationPattern.test(assosiation)
            || !uuidValidationPattern.test(deviceId)) {
            return NextResponse.json({ message: "Typevalidation failed" }, { status: 400 });
        }

        // GET user
        const dbUser = await prisma.user.findFirst({
            where: {
                username: username,
                assosiation: {
                    id: assosiation,
                },
                active: true,
            },
            include: { assosiation: true }
        });

        // VALIDATE CREDENTIALS
        if (!dbUser) {
            session.destroy();
            return NextResponse.json("User Authentification failed", { status: 401 });
        }
        // WRONG CREDENTIALS
        if (!await bcrypt.compare(password, dbUser.password) || !dbUser.active) {
            if (dbUser.failedLoginCount == 5) {
                await prisma.user.update({
                    where: { id: dbUser.id },
                    data: { active: false },
                });
            } else {
                await prisma.user.update({
                    where: { id: dbUser.id },
                    data: {
                        failedLoginCount: { increment: 1 }
                    }
                });
            }

            session.destroy();
            return NextResponse.json({ message: "User Authentification failed" }, { status: 401 });
        }
        // Login Successfull
        await prisma.user.update({
            where: { id: dbUser.id },
            data: { failedLoginCount: 0 }
        });

        // CREATE iron-session user and token
        const token = await getRefreshToken(dbUser.id, deviceId);
        const user: IronSessionUser = {
            name: dbUser.name,
            username: dbUser.username,
            assosiation: assosiation,
            acronym: dbUser.assosiation.acronym,
            role: dbUser.role,
        }

        // SAVE iron-session
        session.user = user;
        await session.save();
        return NextResponse.json({ loginSuccesfull: true, refreshToken: token });
    } catch (error) {
        session.destroy();
        console.error(error);
        throw new Error('Login failed');
    }
}

async function getRefreshToken(userId: string, deviceId: string): Promise<string | null> {
    try {
        // get Token from DB
        let dbToken = await prisma.refreshToken.findFirst({
            where: {
                fk_user: userId,
                deviceId: deviceId
            },
            orderBy: {
                endOfLife: 'desc'
            }
        })

        // CHECK if token exists and lifetime is long enough
        if (dbToken && new Date(dbToken.endOfLife) > new Date(new Date().getTime() + (24 * 3600000))) {
            // RETRURN token if true
            return createJWToken(userId, dbToken.token);
        }

        // CREATE new token
        const token = crypto.randomBytes(25).toString('hex');

        // INSERT new token in db
        dbToken = await prisma.refreshToken.create({
            data: {
                token,
                deviceId,
                fk_user: userId,
                endOfLife: new Date(new Date().getTime() + (5 * 24 * 3600000))
            }
        });

        // return token
        if (dbToken) {
            return createJWToken(userId, token);
        }
    } catch (error) {
        console.error(error);
    }
    // when something didnt work
    return null;
}

function createJWToken(userId: string, token: string) {
    return jwt.sign({
        userId,
        token
    }, process.env.REFRESH_TOKEN_KEY, { expiresIn: 5 * 24 * 3600 });
}
