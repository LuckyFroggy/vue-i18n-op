import JSImporter from './JSImporter'
import VueImporter from './VueImporter'
import CurrentFile from '../CurrentFile'
import { extname } from 'path'
import type { FileExt } from '../..'
class Importer {
    constructor() {
    }

    strategy(extName:FileExt) {
        const strategy: Record<FileExt, VueImporter | JSImporter> = {
            '.vue': new VueImporter(),
            '.js': new JSImporter(),
            '.ts': new JSImporter(),
        }
        return strategy[extName]
    }
}
export default function (extName=CurrentFile.extName as FileExt): VueImporter | JSImporter {
    const fun = new Importer()
    return fun.strategy(extName)
}