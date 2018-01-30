import * as del from "del";
import * as fs from "fs";
import * as path from "path";
import * as util from "util";
import * as glob from "glob";

async function deleteFiles(destFolder: string, destExt: string): Promise<void> {
    try {
        const deletedFiles = await del(path.join(destFolder, `**/*${destExt}`), { force: true });
        deletedFiles.forEach(file => {
            console.log(`Deleted: ${file}`);
        });
    } catch (err) {
        console.error("Error Deleting Files", err);
    }
}

async function copyFiles(srcFolder: string, srcFilesGlob: string, destFolder: string, destExt: string, doReplace: boolean): Promise<void> {
    try {
        const globAsync = util.promisify(glob);
        const files = await globAsync(path.join(srcFolder, srcFilesGlob));

        files.forEach(async file => {
            await copyFile(srcFolder, file.replace(srcFolder, ""), destFolder, destExt, doReplace);
        })
    } catch (err) {
        console.error("Error Copying Files", err);
    }
}

async function copyFile(srcFolder: string, srcFile: string, destFolder: string, destExt: string, doReplace: boolean): Promise<void> {
    try {
        console.log(`Copying: ${srcFile}`);

        const readFileAsync = util.promisify(fs.readFile);
        const writeFileAsync = util.promisify(fs.writeFile);

        const contentBuffer = await readFileAsync(path.join(srcFolder, srcFile));
        let content = contentBuffer.toString();

        if (doReplace) {
            content = content.replace(/(\):.*){/g, ") {");
            content = content.replace(/: INetworkEndPoint/g, "");
            content = content.replace(/: string/g, "");
            content = content.replace(/: any\[\]/g, "");
            content = content.replace(/: any/g, "");
        }

        await writeFileAsync(path.join(destFolder, srcFile.replace(".ts", destExt)), content);
    } catch (err) {
        console.error(err);
    }
}

deleteFiles("../iota-pico-examples-nodejs-js/src/", ".js", true);
copyFiles("../iota-pico-examples-nodejs-ts/src/api/", "**/!(*.d).ts", "../iota-pico-examples-nodejs-js/src/api", ".js", true);
copyFiles("../iota-pico-examples-nodejs-ts/src/", "index.ts", "../iota-pico-examples-nodejs-js/src", ".js", true);
copyFiles("../iota-pico-examples-nodejs-ts/src/", "networkConfig.ts", "../iota-pico-examples-nodejs-js/src", ".js", true);

//copyFiles("../iota-pico-examples-nodejs-ts/src/", "**/!(*.d).ts", "../iota-pico-examples-nodejs-js/src", ".js", true);