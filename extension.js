const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

let vcvarsPath;

function run(textEditor) {
    const filePath = textEditor.document.fileName;
    const terminal = vscode.window.createTerminal(`Progen`,`C:\\WINDOWS\\system32\\cmd.exe`,`/k "${vcvarsPath}"`);
    terminal.show();
    terminal.sendText(`cl /EHsc "${filePath}"`);
}

const searchFile = (dir, fileName, callback) => {
    fs.readdir(dir, { withFileTypes: true }, (err, files) => {
        if (err) {
            console.error(err);
            return;
        }

        for (const file of files) {
            const fullPath = path.join(dir, file.name);

            if (file.isDirectory()) {
                searchFile(fullPath, fileName, callback);
            } else if (file.name === fileName) {
                callback(fullPath);
            }
        }
    });
};


const treeData =
    [
        {
            label: "run",
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            command:{
                command: "progen.run",
                title: "comple&run",
                arguments: []
            }
        },
        {
            label: "export",
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            command:{
                command: "progen.export",
                title: "export",
                arguments: []
            }
        }
    ];

class TreeDataProvider {
    getTreeItem(element)  {
        return element;
    }

    getChildren(element) {
        if (!element) {
            return treeData;
        } else {
            return element.children;
        }
    }
}

function activate(context) {
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('progen.run', run));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('progen.export', run));
    vscode.window.registerTreeDataProvider('progen', new TreeDataProvider());
    
    searchFile(`C:\\Program Files (x86)\\Microsoft Visual Studio`,`vcvars32.bat`,(path)=>{
        vcvarsPath = path;
        vscode.window.showInformationMessage(path);
    });
    searchFile(`C:\\Program Files\\Microsoft Visual Studio`,`vcvars32.bat`,(path)=>{
        vcvarsPath = path;
        vscode.window.showInformationMessage(path);
    });
}

function deactivate() {
    return undefined;
}

module.exports = { activate, deactivate };
