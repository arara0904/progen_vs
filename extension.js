const vscode = require('vscode');

function run() {
    vscode.window.showInformationMessage('Hello, world!');
}

const treeData =
    [
        {
            label: "run",
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            command:{
                command: "progen.run",
                title: "run",
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
    context.subscriptions.push(vscode.commands.registerCommand('progen.run', run));
    vscode.window.registerTreeDataProvider('progen', new TreeDataProvider());
}

function deactivate() {
    return undefined;
}

module.exports = { activate, deactivate };
