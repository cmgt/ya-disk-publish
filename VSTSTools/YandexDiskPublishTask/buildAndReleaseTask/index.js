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
const tl = require("azure-pipelines-task-lib/task");
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
            tl.debug('contents:');
            contents.forEach((v, i, arr) => tl.debug(v));
            tl.debug(`source folder: '${sourceFolder}'`);
            tl.debug(`target folder: '${targetFolder}'`);
            tl.debug(`oauth token: '${oauthToken}'`);
            let allPaths = tl.find(sourceFolder); // default find options (follow sym links)
            let matchedPaths = tl.match(allPaths, contents, sourceFolder); // default match options
            let matchedFiles = matchedPaths.filter((itemPath) => !tl.stats(itemPath).isDirectory()); // filter-out directories
            tl.debug('all find path:');
            allPaths.forEach((v, i, arr) => tl.debug(v));
            tl.debug('matched paths:');
            matchedPaths.forEach((v, i, arr) => tl.debug(v));
            tl.debug('matched files:');
            matchedFiles.forEach((v, i, arr) => tl.debug(v));
            // publish the files to the target folder		
            console.log(tl.loc('FoundNFiles', matchedFiles.length));
            if (matchedFiles.length == 0) {
                console.log("Not found files to publish");
            }
            else {
                UploadFiles(matchedFiles, sourceFolder, targetFolder, oauthToken)
                    .then(() => console.log('Task done'))
                    .catch((err) => tl.setResult(tl.TaskResult.Failed, err));
            }
        }
        catch (e) {
            tl.setResult(tl.TaskResult.Failed, e.message);
        }
    });
}
function UploadFiles(files, sourceFolder, targetFolder, oauthToken) {
    const deferred = Q.defer();
    let yd = new yandexDisk.YandexDisk(oauthToken);
    console.log('Create Yandex.Disk web client');
    let createdFolders = {};
    let createFolderPromise = Q(true);
    let fileUploadPromises = [];
    for (let file of files) {
        let relativePath = file.substring(sourceFolder.length);
        // trim leading path separator
        // note, assumes normalized above
        if (relativePath.startsWith(path.sep)) {
            relativePath = relativePath.substr(1);
        }
        let targetPath = path.join(targetFolder, relativePath);
        let targetDir = path.dirname(targetPath);
        if (!createdFolders[targetDir]) {
            console.log('Recursive create folders ' + targetDir);
            var pathParts = targetDir.split(path.sep);
            let parentDir = "";
            for (let childDir of pathParts) {
                parentDir = path.join(parentDir, childDir);
                if (!createdFolders[parentDir]) {
                    let subdir = parentDir;
                    tl.debug('create subdir ' + subdir);
                    createFolderPromise = createFolderPromise.then(() => ydCreateDir(yd, subdir));
                    createdFolders[parentDir] = true;
                }
            }
            createdFolders[targetDir] = true;
        }
        createFolderPromise = createFolderPromise.then(() => {
            fileUploadPromises.push(ydUploadFile(yd, file, targetPath));
            return true;
        });
    }
    createFolderPromise
        .then(() => Q.all(fileUploadPromises)
        .then(() => deferred.resolve(null)))
        .catch((err) => deferred.reject(err));
    return deferred.promise;
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
            console.error('Fail upload file ' + file + ' to path ' + targetPath + '. ' + err);
            deferred.reject(err);
        }
        else {
            console.log('Success upload file ' + file + ' to path ' + targetPath);
            deferred.resolve(null);
        }
    });
    return deferred.promise;
}
run();
//# sourceMappingURL=index.js.map