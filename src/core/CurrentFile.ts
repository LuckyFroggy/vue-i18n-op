import { extname } from 'path'
import type { Uri } from 'vscode'
import { SnippetString } from 'vscode'
import { Position } from 'vscode'
import { Range } from 'vscode'
import { WorkspaceEdit, window, workspace } from 'vscode'
import type { FileExt } from '..'
import Extractor from './Extractor'
import Replacer from './Replacer'
export default class CurrentFile {
    static async getExtractedWords() {
        const extractor = Extractor()
        const res = await extractor.extract()
        return res
    }

    static get text(): string {
        return window.activeTextEditor?.document?.getText() ?? ''
    }

    static get getUri(): Uri {
        console.log('window.activeTextEditor=>', window.activeTextEditor)
        return window.activeTextEditor?.document?.uri as Uri
    }

    static get fsPath() {
        return window.activeTextEditor?.document?.uri?.fsPath ?? ''
    }

    static replaceWith() {
        Replacer.replaceWith()
    }

    static get extName(): FileExt {
        return extname(CurrentFile.fsPath) as FileExt
    }
}