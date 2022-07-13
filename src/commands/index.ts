import * as global from '../utils/global'
import CurrentFile from '../core/CurrentFile'
import type { ExtensionContext, Uri } from 'vscode'
import { commands, window } from 'vscode'
import TranslatePane from '../core/TranslatePane'
import LocaleDir from '../core/LocaleDir'
export default class Commands {
    static register(context: ExtensionContext): void {
        commands.registerCommand(`${global.EXTENSION_NAME}.setLocaleDir`, () => LocaleDir.set())
        commands.registerCommand(`${global.EXTENSION_NAME}.openTranslatePane`, (uri: Uri) => TranslatePane.open(uri))
        commands.registerCommand(`${global.EXTENSION_NAME}.replaceWith`, () => CurrentFile.replaceWith())
    }
}