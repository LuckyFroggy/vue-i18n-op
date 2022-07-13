import { readFileSync } from 'fs'
import path from 'path'
import Config from '../Config'
export type DeclarationType = 'Identifier' | 'ObjectExpression'
export interface LangJSON {
    [propName: string]: any
}
export default abstract class LangParser {
    protected _word = ''
    protected _keys: string[] = []
    getCode(langPath: string) {
        const dir = path.join(Config.rootDir, Config.localeDir, langPath)
        return readFileSync(dir, 'utf8')
    }
    abstract findMatchKeys(langPath: string, word: string): Promise<string[]>
}