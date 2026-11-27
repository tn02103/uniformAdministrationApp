"use server";

export const devLogger = async (message: string, ...optionalParams: any[]) => {
    if (process.env.NODE_ENV === "development") {
        console.log("DEV LOGGER:", message, ...optionalParams);
    }
};