const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

let vcvarsPath;

function run(textEditor) {
    const document = textEditor.document
    const filePath = document.fileName;
    const terminal = vscode.window.createTerminal(`Progen`,`C:\\WINDOWS\\system32\\cmd.exe`,`/k "${vcvarsPath}"`);
    terminal.show();
    terminal.sendText(`chcp 65001`);
    terminal.sendText(`cl.exe /EHsc "${filePath}" /Fo"${path.parse(filePath).dir}\\${path.parse(filePath).name}" /Fe"${path.parse(filePath).dir}\\${path.parse(filePath).name}"`);
    terminal.sendText(`"${path.parse(filePath).dir}/${path.parse(filePath).name}.exe"`);
}

function file_export(textEditor) {

    const document = textEditor.document;
    const filePath = document.fileName;
    const content = `/*** ${path.parse(filePath).base} ***/\n/*** ps00 ***/\n\n${document.getText()}\n\n/***実行結果\n\n`;
    const exportPath = path.join(vscode.workspace.rootPath, 'export', path.basename(document.fileName));
    const dir = `${path.parse(filePath).dir}/export`;

    const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
    const buffer = Buffer.concat([bom, Buffer.from(content, 'utf8')]);

    fs.mkdir(dir, { recursive: true }, (err) => {
        fs.writeFileSync(exportPath, buffer, (err) => {
            if (err) {
                vscode.window.showErrorMessage('ファイルの保存に失敗しました: ' + err.message);
            } else {
                vscode.window.showInformationMessage('ファイルが保存されました: ' + exportPath);
            }
        });

        if (err) {
            return console.error(err);
        }

        const terminal = vscode.window.createTerminal(`Progen`,`C:\\WINDOWS\\system32\\cmd.exe`,`/k "${vcvarsPath}"`);
        terminal.show();
        terminal.sendText(`chcp 65001`);
        terminal.sendText(`cl.exe /EHsc "${filePath}" /Fo"${path.parse(filePath).dir}\\${path.parse(filePath).name}" /Fe"${path.parse(filePath).dir}\\${path.parse(filePath).name}"`);
        terminal.sendText(`("${path.parse(filePath).dir}/${path.parse(filePath).name}.exe" &&echo;&&echo;&&echo ***/) >> "${path.parse(filePath).dir}/export/${path.parse(filePath).base}"`);
    });
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

const searchMSVC = (callback)=>{
    const PFsPaths = [`C:\\Program Files`,`C:\\Program Files (x86)`]

    for(let i=0;i<2;i++){
        fs.readdir(PFsPaths[i], { withFileTypes: true }, (err, files) => {
            if (err) {
                vscode.window.showInformationMessage(err.message);
            }
            for (const file of files) {
                const fullPath = path.join(PFsPaths[i], file.name);
                if (file.isDirectory() && file.name.match(/^Microsoft Visual Studio/)) {
                    callback(fullPath);
                }
            }
        });
    }
}


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
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('progen.export', file_export));
    vscode.window.registerTreeDataProvider('progen', new TreeDataProvider());

    searchMSVC((MSVCpath)=>{
        searchFile(MSVCpath,`vcvars32.bat`,(path)=>{
            vcvarsPath = path;
            vscode.window.showInformationMessage(path);
        });
    });
}

function deactivate() {
    return undefined;
}

module.exports = { activate, deactivate };
