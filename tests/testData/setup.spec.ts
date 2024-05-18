import test from "playwright/test";
import { cleanupData, deleteAssosiation } from "./cleanupStatic";


test.skip('cleanup', async () => {
    await cleanupData(0);
    await cleanupData(1);
    await cleanupData(2);
    await cleanupData(3);
    await cleanupData(4);
});

test.skip('clear testData', async () => {
    for (let i = 0; i < 5 ;i++) {
        try{
            await deleteAssosiation(i);
        } catch(e) {
            console.error(e);
        }
    }
});