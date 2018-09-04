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
		
		// publish the files to the target folder		
		console.log(tl.loc('FoundNFiles', matchedFiles.length));		
		               
        let yd = new yandexDisk.YandexDisk(oauthToken);
		console.log('Create Yandex.Disk web client');
		
		let createdFolders: { [folder: string]: boolean } = {};
		
		matchedFiles.forEach((file: string) => {            		
            let relativePath = file.substring(sourceFolder.length);
			// trim leading path separator
			// note, assumes normalized above
			if (relativePath.startsWith(path.sep)) {
				relativePath = relativePath.substr(1);
			}		

            let targetPath = path.join(targetFolder, relativePath);
            let targetDir = path.dirname(targetPath);

		    let promises: Q.Promise<any>[] = [];

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
}

function ydCreateDir(yd: yandexDisk.YandexDisk, dirPath: string): Q.Promise<boolean> {
    const deferred = Q.defer<boolean>();

    tl.debug('call yd.mkdir ' + dirPath);    
    
    yd.mkdir(dirPath,
        (err, created) => {
            if (err) {
                console.error('Fail create folder ' + dirPath + '. ' + err);
                deferred.reject(err);
            } else {
                if (created) {
                    console.log('Success create folder ' + dirPath);
                } else {
                    console.warn('Folder ' + dirPath + ' already exist');
                }

                deferred.resolve(created);
            }
        });       

    return deferred.promise;
}

function ydUploadFile(yd: yandexDisk.YandexDisk, file: string, targetPath: string): Q.Promise<void> {
    const deferred = Q.defer<void>();

    tl.debug('call yd.uploadFile ' + file + ' to ' + targetPath);

    yd.uploadFile(file, targetPath, 
        (err) => {
            if (err) {
                console.error('Fail upload file ' + file + ' to path ' + targetPath);
                deferred.reject(err);
            } else {
                console.log('Success upload file ' + file + ' to path ' + targetPath);
                deferred.resolve();
            }
        });       

    return deferred.promise;
}

run();