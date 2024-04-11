import { prisma } from "@/lib/db";
import test from "playwright/test";
import { cleanupData } from "./cleanupStatic";
import { testAssosiation, testWrongAssosiation } from "./staticData";


test.skip('cleanup', async () => {
    await cleanupData();

});