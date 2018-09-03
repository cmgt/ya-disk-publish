import tl = require('vsts-task-lib/task');
import fs = require('fs');
import path = require('path');
var YandexDisk = require('yandex-disk').YandexDisk;

async function run() {
    try {        
		tl.setResourcePath(path.join(__dirname, 'task.json'));
		
		let contents: string[] = tl.getDelimitedInput('contents', '\n', true);
		let sourceFolder: string = tl.getPathInput('sourcepath', true, true);
		let targetFolder: string = tl.getPathInput('destpath', true);		
		let oauthToken: string = tl.getPathInput('oauthtoken', true);		
		let overWrite: boolean = tl.getBoolInput('overwrite', false);
		
		// normalize the source folder path. this is important for later in order to accurately
		// determine the relative path of each found file (substring using sourceFolder.length).
		sourceFolder = path.normalize(sourceFolder);
		
		let allPaths: string[] = tl.find(sourceFolder); // default find options (follow sym links)
		let matchedPaths: string[] = tl.match(allPaths, contents, sourceFolder); // default match options
		let matchedFiles: string[] = matchedPaths.filter((itemPath: string) => !tl.stats(itemPath).isDirectory()); // filter-out directories
		
		// publich the files to the target folder		
		console.log(tl.loc('FoundNFiles', matchedFiles.length));		
		
		let yd = new YandexDisk(oauthToken);
		console.log('Create Yandex.Disk web client');
		
		matchedFiles.forEach((file: string) => {            		
            let relativePath = file.substring(sourceFolder.length);
			// trim leading path separator
			// note, assumes normalized above
			if (relativePath.startsWith(path.sep)) {
				relativePath = relativePath.substr(1);
			}		

            let targetPath = path.join(targetFolder, relativePath);
            let targetDir = path.dirname(targetPath);
			let targetFile = path.join(targetFolder, path.basename(relativePath));
						
			yd.uploadFile(file, targetFile, function(err) {
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
}

run();