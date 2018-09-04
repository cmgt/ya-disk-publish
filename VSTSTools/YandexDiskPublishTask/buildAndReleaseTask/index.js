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
const Q = require("q");
const yandexDisk = require("yandex-disk");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            tl.setResourcePath(path.join(__dirname, 'task.json'));
            let contents = tl.getDelimitedInput('contents', '\n', true);
            let sourceFolder = tl.getPathInput('sourcepath', true, true);
            let targetFolder = tl.getPathInput('destpath', true);
            let oauthToken = tl.getInput('oauthtoken', true);
            // normalize the source folder path. this is important for later in order to accurately
            // determine the relative path of each found file (substring using sourceFolder.length).
            sourceFolder = path.normalize(sourceFolder);
            let allPaths = tl.find(sourceFolder); // default find options (follow sym links)
            let matchedPaths = tl.match(allPaths, contents, sourceFolder); // default match options
            let matchedFiles = matchedPaths.filter((itemPath) => !tl.stats(itemPath).isDirectory()); // filter-out directories
            // publish the files to the target folder		
            console.log(tl.loc('FoundNFiles', matchedFiles.length));
            let yd = new yandexDisk.YandexDisk(oauthToken);
            console.log('Create Yandex.Disk web client');
            let createdFolders = {};
            matchedFiles.forEach((file) => {
                let relativePath = file.substring(sourceFolder.length);
                // trim leading path separator
                // note, assumes normalized above
                if (relativePath.startsWith(path.sep)) {
                    relativePath = relativePath.substr(1);
                }
                let targetPath = path.join(targetFolder, relativePath);
                let targetDir = path.dirname(targetPath);
                let promises = [];
                if (!createdFolders[targetDir]) {
                    console.log('Recursive create folders ' + targetDir);
                    targetDir.split(path.sep).reduce((parentDir, childDir) => {
                        const curDir = path.resolve(parentDir, childDir);
                        tl.debug('create subdir ' + curDir);
                        promises.push(ydCreateDir(yd, curDir));
                        return curDir;
                    });
                    createdFolders[targetDir] = true;
                }
                promises.push(ydUploadFile(yd, file, targetPath));
                promises.reduce(Q.when, Q())
                    .fail((err) => {
                    console.error(err);
                    throw err;
                });
            });
        }
        catch (e) {
            tl.setResult(tl.TaskResult.Failed, e.message);
        }
    });
}
function ydCreateDir(yd, dirPath) {
    const deferred = Q.defer();
    tl.debug('call yd.mkdir ' + dirPath);
    yd.mkdir(dirPath, (err, created) => {
        if (err) {
            console.error('Fail create folder ' + dirPath + '. ' + err);
            deferred.reject(err);
        }
        else {
            if (created) {
                console.log('Success create folder ' + dirPath);
            }
            else {
                console.warn('Folder ' + dirPath + ' already exist');
            }
            deferred.resolve(created);
        }
    });
    return deferred.promise;
}
function ydUploadFile(yd, file, targetPath) {
    const deferred = Q.defer();
    tl.debug('call yd.uploadFile ' + file + ' to ' + targetPath);
    yd.uploadFile(file, targetPath, (err) => {
        if (err) {
            console.error('Fail upload file ' + file + ' to path ' + targetPath);
            deferred.reject(err);
        }
        else {
            console.log('Success upload file ' + file + ' to path ' + targetPath);
            deferred.resolve();
        }
    });
    return deferred.promise;
}
run();
//# sourceMappingURL=index.js.map