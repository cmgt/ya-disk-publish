"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("vsts-task-lib/task");
const path = require("path");
var YandexDisk = require('yandex-disk').YandexDisk;
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            tl.setResourcePath(path.join(__dirname, 'task.json'));
            let contents = tl.getDelimitedInput('contents', '\n', true);
            let sourceFolder = tl.getPathInput('sourcepath', true, true);
            let targetFolder = tl.getPathInput('destpath', true);
            let oauthToken = tl.getPathInput('oauthtoken', true);
            let overWrite = tl.getBoolInput('overwrite', false);
            // normalize the source folder path. this is important for later in order to accurately
            // determine the relative path of each found file (substring using sourceFolder.length).
            sourceFolder = path.normalize(sourceFolder);
            let allPaths = tl.find(sourceFolder); // default find options (follow sym links)
            let matchedPaths = tl.match(allPaths, contents, sourceFolder); // default match options
            let matchedFiles = matchedPaths.filter((itemPath) => !tl.stats(itemPath).isDirectory()); // filter-out directories
            // publich the files to the target folder		
            console.log(tl.loc('FoundNFiles', matchedFiles.length));
            let yd = new YandexDisk(oauthToken);
            console.log('Create Yandex.Disk web client');
            matchedFiles.forEach((file) => {
                let relativePath = file.substring(sourceFolder.length);
                // trim leading path separator
                // note, assumes normalized above
                if (relativePath.startsWith(path.sep)) {
                    relativePath = relativePath.substr(1);
                }
                let targetPath = path.join(targetFolder, relativePath);
                let targetDir = path.dirname(targetPath);
                let targetFile = path.join(targetFolder, path.basename(relativePath));
                yd.uploadFile(file, targetFile, function (err) {
                    console.log(file + ' -> ' + targetFile);
                    if (err) {
                        console.log(err);
                        throw err;
                    }
                });
            });
        }
        catch (err) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    });
}
run();
//# sourceMappingURL=index.js.map