import * as global from '../utils/global'
import CurrentFile from '../core/CurrentFile'
import type { ExtensionContext, Uri } from 'vscode'
import { commands, window, workspace } from 'vscode'
import * as vscode from 'vscode'
import TranslatePane from '../core/TranslatePane'
import LocaleDir from '../core/LocaleDir'
import Global from '../core/Global'
import { annotationDisposables } from '../core/Annotation'
import Config from '../core/Config'
export default class Commands {
    static register(context: ExtensionContext): void {
        function updateChineseAnnotationVisible() {
            commands.executeCommand('setContext', 'chineseAnnotationVisible', Config.chineseAnnotationVisible ?? true);
        }
        updateChineseAnnotationVisible()
        workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration(`${global.EXTENSION_NAME}.chineseAnnotationVisible`)) {
                updateChineseAnnotationVisible();
            }
        });
        context.subscriptions.push(commands.registerCommand(`${global.EXTENSION_NAME}.setLocaleDir`, () => LocaleDir.set()))
        context.subscriptions.push(commands.registerCommand(`${global.EXTENSION_NAME}.openTranslatePane`, (uri: Uri) => TranslatePane.open(uri)))
        context.subscriptions.push(commands.registerCommand(`${global.EXTENSION_NAME}.replaceWith`, () => CurrentFile.replaceWith()))
        context.subscriptions.push(commands.registerCommand(`${global.EXTENSION_NAME}.exportToExcel`, (uri: Uri) => Global.exportToExcel(uri)))
        context.subscriptions.push(commands.registerCommand(`${global.EXTENSION_NAME}.importExcel`, (uri: Uri) => Global.importExcel()))
        context.subscriptions.push(commands.registerCommand(`${global.EXTENSION_NAME}.replaceAll`, (uri: Uri) => Global.replaceAll(uri)))
        context.subscriptions.push(...annotationDisposables())
    }
}