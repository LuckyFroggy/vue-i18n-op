// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import type * as vscode from 'vscode'
import Commands from './commands'
import Config from './core/Config'
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    Config.ctx = context
    // 注册命令
    Commands.register(context)
}

// this method is called when your extension is deactivated
export function deactivate() {}
