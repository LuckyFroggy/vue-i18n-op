export type MessageType = 'loaded' | 'translate' | 'translateAll' | 'save'
export interface WordListItem {
    id: string
    key: string
    lang: {
        zh: string
        en: string
    }
}