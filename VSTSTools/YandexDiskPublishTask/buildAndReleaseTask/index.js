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
            // publich the files to the target folder		
            console.log(tl.loc('FoundNFiles', matchedFiles.length));
            let yd = new yandexDisk.YandexDisk(oauthToken);
            console.log('Create Yandex.Disk web client');
            let createdFolders = {};
            matchedFiles.forEach((file) => __awaiter(this, void 0, void 0, function* () {
                let relativePath = file.substring(sourceFolder.length);
                // trim leading path separator
                // note, assumes normalized above
                if (relativePath.startsWith(path.sep)) {
                    relativePath = relativePath.substr(1);
                }
                let targetPath = path.join(targetFolder, relativePath);
                let targetDir = path.dirname(targetPath);
                if (!createdFolders[targetDir]) {
                    var created = yield ydCreateDir(yd, targetDir)
                        .fail((err) => {
                        console.log(err);
                    });
                    if (created) {
                        console.log('Success create folder ' + targetDir);
                    }
                    else {
                        console.log('Folder ' + targetDir + ' already exist');
                    }
                    createdFolders[targetDir] = true;
                }
                console.log(file + ' -> ' + targetPath);
                yield ydUploadFile(yd, file, targetPath)
                    .fail((err) => {
                    console.log(err);
                });
                ;
                console.log('Success upload file ' + file);
            }));
        }
        catch (err) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    });
}
function ydCreateDir(yd, path) {
    const deferred = Q.defer();
    tl.debug('call yd.mkdir');
    yd.mkdir(path, (err, created) => {
        if (err) {
            console.log('Fail create folder ' + path);
            deferred.reject(err);
        }
        else {
            deferred.resolve(created);
        }
    });
    return deferred.promise;
}
function ydUploadFile(yd, file, targetPath) {
    const deferred = Q.defer();
    tl.debug('call yd.uploadFile');
    yd.uploadFile(file, targetPath, (err) => {
        if (err) {
            console.log('Fail upload file ' + file + ' to target path ' + targetPath);
            deferred.reject(err);
        }
        else {
            deferred.resolve();
        }
    });
    return deferred.promise;
}
run();
//# sourceMappingURL=index.js.map