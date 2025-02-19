import * as fs from 'fs';
import * as path from 'path';

const IGNORE_LIST = [
    'src\\dal\\inspection\\_dbQuerys.ts',
    'src\\dal\\inspection\\planned\\_dbQuerys.ts',
    'src\\dal\\cadet\\_dbQuerys.ts',
];
const TARGET_FOLDER = './src/dal';

const checkUseServer = (filePath: string) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.trim().startsWith('"use server"');
};

const getAllFiles = (dir: string, fileList: string[] = []) => {
    if (/_helper/.test(dir)) return fileList;

    fs.readdirSync(dir).forEach((file) => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, fileList);
        } else {
            fileList.push(fullPath);
        }
    });
    return fileList;
};
it('doesn nothing', () => {

});

/*
describe('Check "use server" at the beginning of files', () => {
    const allFiles = getAllFiles(TARGET_FOLDER);

    allFiles.forEach((file) => {
       
        if (
            !file.endsWith('.test.ts') &&
            !IGNORE_LIST.includes(file)
        ) {
            it(`should have "use server" at the beginning of ${file}`, () => {
                expect(checkUseServer(file)).toBe(true);
            });
        }
    });
});*/
