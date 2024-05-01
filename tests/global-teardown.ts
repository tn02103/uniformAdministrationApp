import { cleanupData, deleteEverything } from './testData/cleanupStatic';

async function globalTeardown() {
    try {
        if (process.env.STAGE !== "DEV") {
            await deleteEverything(0);
        } else {
            await cleanupData();
        }
    } catch (e) { }
};

export default globalTeardown;
