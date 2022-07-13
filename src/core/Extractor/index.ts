import JSExtractor from './JSExtractor'
import VueExtractor from './VueExtractor'
import CurrentFile from '../CurrentFile'
import { extname } from 'path'
import type { FileExt } from '../..'
class Extractor {
    constructor() {
    }

    strategy() {
        const strategy: Record<FileExt, VueExtractor | JSExtractor> = {
            '.vue': new VueExtractor(),
            '.js': new JSExtractor(),
            '.ts': new JSExtractor(),
        }
        return strategy[CurrentFile.extName]
    }
}
export default function extractor(): VueExtractor | JSExtractor {
    const fun = new Extractor()
    return fun.strategy()
}