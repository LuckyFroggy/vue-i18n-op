import { regExpExistChinese } from '../../utils'

export default abstract class Extractor {
    result: any
    isExistChinese(text: string) {
        return regExpExistChinese.test(text)
    }
}