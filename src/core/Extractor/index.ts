import JSExtractor from './JSExtractor'
import VueExtractor from './VueExtractor'
import CurrentFile from '../CurrentFile'
import { extname } from 'path'
import type { FileExt } from '../..'
class Extractor {
    constructor() {
    }

    strategy(extName:FileExt) {
        const strategy: Record<FileExt, VueExtractor | JSExtractor> = {
            '.vue': new VueExtractor(),
            '.js': new JSExtractor(),
            '.ts': new JSExtractor(),
        }
        return strategy[extName]
    }
}
export default function extractor(extName=CurrentFile.extName as FileExt): VueExtractor | JSExtractor {
    const fun = new Extractor()
    return fun.strategy(extName)
}