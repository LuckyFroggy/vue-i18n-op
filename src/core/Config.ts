import type { ExtensionContext } from 'vscode'
import { workspace } from 'vscode'
import * as global from '../utils/global'
export default class Config {
    static ctx: ExtensionContext

    static get localeDir(): string {
        return this.getConfiguration<string>('localeDir') ?? ''
    }

    static get rootDir(): string {
        return workspace.workspaceFolders?.[0]?.uri?.fsPath as string
    }

    static get vueLocaleFunName(): string {
        return this.getConfiguration<string>('vueLocaleFunName') ?? ''
    }

    static get localeFunName(): string {
        return this.getConfiguration<string>('localeFunName') ?? ''
    }

    private static getConfiguration<T>(key: string): T | undefined {
        return workspace
            .getConfiguration(global.EXTENSION_NAME)
            .get<T>(key)
    }

    static async set(key: string, value: any) {
        return await workspace
            .getConfiguration(global.EXTENSION_NAME)
            .update(key, value, false)
    }
}