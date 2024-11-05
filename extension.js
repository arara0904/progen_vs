const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
let vcvarsPath;

const setCompiler = (textEditor)=>{
    const document = textEditor.document
    const filePath = document.fileName;
    const folder = path.dirname(filePath);
    searchCompiler(folder,(exist)=>{
        if(exist==false){
            makeCompiler(vcvarsPath,folder,()=>{
                vscode.window.showInformationMessage("success");
            });
        }else{
            vscode.window.showInformationMessage("compiler is already exist");
        }
    });
}

function run(textEditor) {
    const document = textEditor.document
    const filePath = document.fileName;
    const terminal = vscode.window.createTerminal(`Progen`,`powershell`);
    terminal.show();
    terminal.sendText(`./compile.ps1 run "${filePath}"`);
}

function file_export(textEditor) {
    const document = textEditor.document
    const filePath = document.fileName;
    const config = vscode.workspace.getConfiguration('progen');
    const username = config.get('username');

    const terminal = vscode.window.createTerminal(`Progen`,`powershell`);
    terminal.show();
    terminal.sendText(`./compile.ps1 export "${filePath}" "${username}"`);
}

function file_export_only(textEditor) {
    const document = textEditor.document
    const filePath = document.fileName;
    const config = vscode.workspace.getConfiguration('progen');
    const username = config.get('username');

    const terminal = vscode.window.createTerminal(`Progen`,`powershell`);
    terminal.show();
    terminal.sendText(`./compile.ps1 exportonly "${filePath}" "${username}"`);
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

const searchCompiler = (folder,callback)=>{
    let exist = false;
    fs.readdir(folder, { withFileTypes: true }, (err, files) => {
        if (err) {
            vscode.window.showErrorMessage(err.message);
        }
        for (const file of files) {
            if (!file.isDirectory() && file.name.match(/^compile.ps1$/)) {
                exist = true;
            }
        }
        callback(exist);
    });
}

const makeCompiler = (vcvarsPath,folder,callback)=>{
    const vcvarsPathSet = `$vcvarspath = "${vcvarsPath}"\n\n`;
    const exportPath = path.join(folder, "compile.ps1");
    const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
    const buffer = Buffer.concat([bom, Buffer.from(vcvarsPathSet+compiler, 'utf8')]);
    
    fs.writeFileSync(exportPath, buffer, (err) => {
        if (err) {
            vscode.window.showErrorMessage(err.message);
        }else{
            callback();
        }
    });
}

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
            label: "make compiler",
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            command:{
                command: "progen.makeCompiler",
                title: "makeCompiler",
                arguments: []
            }
        },
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
            label: "export only",
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            command:{
                command: "progen.exportOnly",
                title: "exportOnly",
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
        searchFile(MSVCpath,`vcvars32.bat`,(vcvarsFullPath)=>{
            vcvarsPath = path.dirname(vcvarsFullPath);
        });
    });
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('progen.makeCompiler', setCompiler));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('progen.run', run));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('progen.export', file_export));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('progen.exportOnly', file_export_only));
    context.subscriptions.push(vscode.commands.registerCommand('progen.config', moveToConfig));

    vscode.window.registerTreeDataProvider('progen', new TreeDataProvider());
}

function deactivate() {
    return undefined;
}

module.exports = { activate, deactivate };


const compiler=`
chcp 65001
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
$global:OutputEncoding = [System.Text.Encoding]::UTF8
[console]::OutputEncoding = [System.Text.Encoding]::UTF8

pushd $vcvarspath
    cmd /c "vcvars32.bat&set" |
    foreach {
        if ($_ -match "=") {
            $v = $_.split("=", 2); set-item -force -path "ENV:\\$($v[0])"  -value "$($v[1])" 
        }
    }
popd

$filename = [System.IO.Path]::GetFileNameWithoutExtension($args[1])
$filenameext = Split-Path -Leaf $args[1]
$filepath = Split-Path -Parent $args[1]

$filecontext = Get-Content -Raw -Encoding UTF8 -Path $args[1]

cl.exe /EHsc "$($args[1])" /Fe"$filepath\\$filename" /Fo"$filepath\\$filename"
write-host;

if($args[0] -eq "run"){
    & "$filepath\\$filename.exe"
}elseif ($args[0] -eq "export") {
    & "$filepath\\$filename.exe" | Out-String | Tee-Object  -Variable output
    New-Item "$filepath/export" -Force -ItemType Directory > $null
    $context = "/*** $($args[2]) ***/\`n/*** $filename ***/\`n\`n$filecontext\`n\`n/*** 実行結果\`n\`n$output\`n\`n ***/"
    Write-Output $context | Out-File -FilePath "$filepath\\export\\$filenameext" -Encoding UTF8

}elseif ($args[0] -eq "exportonly") {
    & "$filepath\\$filename.exe"
    New-Item "$filepath/export" -Force -ItemType Directory > $null
    $context = "/*** $($args[2]) ***/\`n/*** $filename ***/\`n\`n$filecontext"
    Write-Output $context | Out-File -FilePath "$filepath\\export\\$filenameext" -Encoding UTF8
}`;