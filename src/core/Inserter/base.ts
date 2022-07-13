import { readFileSync } from 'fs'
import path from 'path'
import Config from '../Config'
export type DeclarationType = 'Identifier' | 'ObjectExpression'
export interface LangJSON {
    [propName: string]: any
}
export default abstract class Inserter {
    data: any
    abstract insert(langPath: string, data: any): void
    getCode(langPath: string) {
        const dir = path.join(Config.rootDir, Config.localeDir, langPath)
        return readFileSync(dir, 'utf8')
    }

    getAbsoultePath(langPath: string) {
        return path.join(Config.rootDir, Config.localeDir, langPath)
    }

    isExistKey(key: string): boolean {
        return Object.prototype.hasOwnProperty.call(this.data, key)
    }
}