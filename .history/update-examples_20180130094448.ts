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

async function copyFiles(srcFolder: string, srcFilesGlob: string, destFolder: string, destExt: string, removeTypes: boolean, additionalReplacements?: { [replace: string]: string }): Promise<void> {
    try {
        const globAsync = util.promisify(glob);
        const files = await globAsync(path.join(srcFolder, srcFilesGlob));

        files.forEach(async file => {
            await copyFile(srcFolder, file.replace(srcFolder, ""), destFolder, destExt, removeTypes, additionalReplacements);
        })
    } catch (err) {
        console.error("Error Copying Files", err);
    }
}

async function copyFile(srcFolder: string, srcFile: string, destFolder: string, destExt: string, removeTypes: boolean, additionalReplacements: { [replace: string]: string }): Promise<void> {
    try {
        console.log(`Copying: ${srcFile}`);

        const readFileAsync = util.promisify(fs.readFile);
        const writeFileAsync = util.promisify(fs.writeFile);

        const contentBuffer = await readFileAsync(path.join(srcFolder, srcFile));
        let content = contentBuffer.toString();

        if (removeTypes) {
            content = content.replace(/(\):.*){/g, ") {");
            content = content.replace(/: INetworkEndPoint/g, "");
            content = content.replace(/: string/g, "");
            content = content.replace(/: any\[\]/g, "");
            content = content.replace(/: any/g, "");
        }

        if (additionalReplacements) {
            Object.keys(additionalReplacements)
            .forEach(key => {
                content = content.replace(new RegExp(key, "g"), additionalReplacements[key]);
            });
        }

        await writeFileAsync(path.join(destFolder, srcFile.replace(".ts", destExt)), content);
    } catch (err) {
        console.error(err);
    }
}

async function doAll(): Promise<void> {
    await deleteFiles("../iota-pico-examples-nodejs-js/src/", ".js");
    await copyFiles("../iota-pico-examples-nodejs-ts/src/api/", "**/!(*.d).ts", "../iota-pico-examples-nodejs-js/src/api", ".js", true);
    await copyFiles("../iota-pico-examples-nodejs-ts/src/", "index.ts", "../iota-pico-examples-nodejs-js/src", ".js", true);
    await copyFiles("../iota-pico-examples-nodejs-ts/src/", "networkConfig.ts", "../iota-pico-examples-nodejs-js/src", ".js", true);

    await deleteFiles("../iota-pico-examples-browser-ts/src/", ".ts");
    await copyFiles("../iota-pico-examples-nodejs-ts/src/api/", "**/!(*.d).ts", "../iota-pico-examples-browser-ts/src/api", ".ts", true);
    await copyFiles("../iota-pico-examples-nodejs-ts/src/", "networkConfig.ts", "../iota-pico-examples-browser-ts/src", ".ts", true);
    await copyFiles("../iota-pico-examples-nodejs-ts/src/", "typings.d.ts", "../iota-pico-examples-browser-ts/src", ".ts", false,
    {
        "import { NodeJsNetworkClient } from \"@iota-pico/pal-nodejs/dist/network/nodeJsNetworkClient\";": 
        "import { BrowserNetworkClient } from \"@iota-pico/pal-browser/dist/network/browserNetworkClient\";"
    });
}

doAll();

//copyFiles("../iota-pico-examples-nodejs-ts/src/", "**/!(*.d).ts", "../iota-pico-examples-nodejs-js/src", ".js", true);