import tl = require("vsts-task-lib/task");
import path = require("path");
import Q = require("q");
import yandexDisk = require("yandex-disk");

async function run() {
    try {        

        tl.setResourcePath(path.join(__dirname, 'task.json'));
		
		let contents: string[] = tl.getDelimitedInput('contents', '\n', true);
		let sourceFolder: string = tl.getPathInput('sourcepath', true, true);
		let targetFolder: string = tl.getPathInput('destpath', true);		
		let oauthToken: string = tl.getInput('oauthtoken', true);
		
		// normalize the source folder path. this is important for later in order to accurately
		// determine the relative path of each found file (substring using sourceFolder.length).
		sourceFolder = path.normalize(sourceFolder);
		
		let allPaths: string[] = tl.find(sourceFolder); // default find options (follow sym links)
		let matchedPaths: string[] = tl.match(allPaths, contents, sourceFolder); // default match options
		let matchedFiles: string[] = matchedPaths.filter((itemPath: string) => !tl.stats(itemPath).isDirectory()); // filter-out directories
		
		// publich the files to the target folder		
		console.log(tl.loc('FoundNFiles', matchedFiles.length));		
		               
        let yd = new yandexDisk.YandexDisk(oauthToken);
		console.log('Create Yandex.Disk web client');
		
		let createdFolders: { [folder: string]: boolean } = {};
		
		matchedFiles.forEach(async (file: string) => {            		
            let relativePath = file.substring(sourceFolder.length);
			// trim leading path separator
			// note, assumes normalized above
			if (relativePath.startsWith(path.sep)) {
				relativePath = relativePath.substr(1);
			}		

            let targetPath = path.join(targetFolder, relativePath);
            let targetDir = path.dirname(targetPath);

		    if (!createdFolders[targetDir]) {
		        var created = await ydCreateDir(yd, targetDir)
                    .fail((err) => {
		                console.log(err);
		            });

		        if (created) {
		            console.log('Success create folder ' + targetDir);
		        } else {
		            console.log('Folder ' + targetDir + ' already exist');
		        }

		        createdFolders[targetDir] = true;
		    }

		    console.log(file + ' -> ' + targetPath);
		    await ydUploadFile(yd, file, targetPath)
		        .fail((err) => {
		            console.log(err);
		        });;
		    console.log('Success upload file ' + file);
		});        
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

function ydCreateDir(yd: yandexDisk.YandexDisk, path: string): Q.Promise<boolean> {
    const deferred = Q.defer<boolean>();

    tl.debug('call yd.mkdir');

    yd.mkdir(path,
        (err, created) => {
            if (err) {
                console.log('Fail create folder ' + path);
                deferred.reject(err);
            } else {
                deferred.resolve(created);
            }
        });       

    return deferred.promise;
}

function ydUploadFile(yd: yandexDisk.YandexDisk, file: string, targetPath: string): Q.Promise<void> {
    const deferred = Q.defer<void>();

    tl.debug('call yd.uploadFile');

    yd.uploadFile(file, targetPath, 
        (err) => {
            if (err) {
                console.log('Fail upload file ' + file + ' to target path ' + targetPath);
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });       

    return deferred.promise;
}

run();