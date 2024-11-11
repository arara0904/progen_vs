const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

let vcvarsPath;

function run(textEditor) {
    const config = vscode.workspace.getConfiguration('progen');
    const username = config.get('username');
    const document = textEditor.document
    const filePath = document.fileName;
    const terminal = vscode.window.createTerminal(`Progen`,`C:\\WINDOWS\\system32\\cmd.exe`,`/k "${vcvarsPath}"`);
    terminal.show();
    terminal.sendText(`chcp 932`);
    terminal.sendText(`cl.exe /source-charset:utf-8 /EHsc "${filePath}" /Fo"${path.parse(filePath).dir}\\${path.parse(filePath).name}" /Fe"${path.parse(filePath).dir}\\${path.parse(filePath).name}"`);
    terminal.sendText(`"${path.parse(filePath).dir}\\${path.parse(filePath).name}.exe"`);
}

function file_export(textEditor) {
    const config = vscode.workspace.getConfiguration('progen');
    const username = config.get('username');
    const document = textEditor.document;
    const filePath = document.fileName;
    const content = `/*** ${path.parse(filePath).base} ***/\n/*** ${username} ***/\n\n${document.getText()}\n\n/***実行結果\n\n`;
    const exportPath = path.join(vscode.workspace.rootPath, 'export', path.basename(document.fileName));
    const dir = `${path.parse(filePath).dir}\\export`;

    const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
    const buffer = Buffer.concat([bom, Buffer.from(content, 'utf8')]);

    fs.mkdir(dir, { recursive: true }, (err) => {
        if (err) {
            vscode.window.showErrorMessage(err.message);
        }
        fs.writeFileSync(exportPath, buffer, (err) => {
            if (err) {
                vscode.window.showErrorMessage(err.message);
            }
        });

        const terminal = vscode.window.createTerminal(`Progen`,`C:\\WINDOWS\\system32\\cmd.exe`,`/k "${vcvarsPath}"`);
        terminal.show();
        terminal.sendText(`chcp 932`);
        terminal.sendText(`cl.exe /source-charset:utf-8 /EHsc "${filePath}" /Fo"${path.parse(filePath).dir}\\${path.parse(filePath).name}" /Fe"${path.parse(filePath).dir}\\${path.parse(filePath).name}"`);
        terminal.sendText(`(("${path.parse(filePath).dir}\\${path.parse(filePath).name}.exe"||echo error)&&echo;&&echo;&&echo ***/) >> "${path.parse(filePath).dir}\\export\\${path.parse(filePath).base}"`);
    });
}

function export_without_run(textEditor) {
    const config = vscode.workspace.getConfiguration('progen');
    const username = config.get('username');
    const document = textEditor.document;
    const filePath = document.fileName;
    const content = `/*** ${path.parse(filePath).base} ***/\n/*** ${username} ***/\n\n${document.getText()}\n\n/***実行結果\n\n***/`;
    const exportPath = path.join(vscode.workspace.rootPath, 'export', path.basename(document.fileName));
    const dir = `${path.parse(filePath).dir}\\export`;

    const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
    const buffer = Buffer.concat([bom, Buffer.from(content, 'utf8')]);

    fs.mkdir(dir, { recursive: true }, (err) => {
        if (err) {
            vscode.window.showErrorMessage(err.message);
        }
        fs.writeFileSync(exportPath, buffer, (err) => {
            if (err) {
                vscode.window.showErrorMessage(err.message);
            }else{
                vscode.window.showInformationMessage("successly exported");
            }
        });
    });
}

const moveToConfig = ()=>{
    vscode.commands.executeCommand('workbench.action.openSettings', `progen`);
}

const searchFile = (dir, fileName, callback) => {
    fs.readdir(dir, { withFileTypes: true }, (err, files) => {
        if (err) {
            vscode.window.showErrorMessage(err.message);
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
                vscode.window.showErrorMessage(err.message);
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
        },
        {
            label: "config",
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            command:{
                command: "progen.config",
                title: "config",
                arguments: []
            }
        },
        {
            label: "export witout run",
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            command:{
                command: "progen.exportWithoutRun",
                title: "export witout run",
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
    searchMSVC((MSVCpath)=>{
        searchFile(MSVCpath,`vcvars32.bat`,(path)=>{
            vcvarsPath = path;
        });
    });
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('progen.run', run));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('progen.export', file_export));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('progen.exportWithoutRun', export_without_run));
    context.subscriptions.push(vscode.commands.registerCommand('progen.config', moveToConfig));

    vscode.window.registerTreeDataProvider('progen', new TreeDataProvider());
}

function deactivate() {
    return undefined;
}

module.exports = { activate, deactivate };