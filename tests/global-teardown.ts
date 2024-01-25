import { cleanupData, deleteEverything } from './testData/cleanupStatic';

async function globalTeardown() {
    try {
        if (process.env.STAGE !== "DEV") {
            await deleteEverything();
        } else {
            await cleanupData();
        }
    } catch (e) { }
};

export default globalTeardown;
