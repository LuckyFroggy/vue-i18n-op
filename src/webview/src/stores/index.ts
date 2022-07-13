import { defineStore } from 'pinia'
import type { WordListItem } from '..'
import { randomString } from '../utils'
export const useStore = defineStore('app', {
    state: () => {
        return {
            vscode: window.acquireVsCodeApi(),
            wordList: [] as WordListItem[],
        }
    },
    actions: {
        init(data: { uri: string; extractedWords: string[] }) {
            this.wordList = []
            const { uri, extractedWords } = data
            console.log('uri=>', uri)
            console.log('')

            const FILE_NAME = uri.replace(/\/|\\/g, '\n').split('\n').slice(-1)[0]?.split('.')?.[0] ?? 'key'
            extractedWords.forEach((item: string) => {
                this.wordList.push({
                    id: randomString(), // 唯一id
                    key: `${FILE_NAME}.${randomString()}`,
                    lang: {
                        zh: item,
                        en: '',
                    },
                })
            })
        },
        translate(data: WordListItem) {
            this.wordList.forEach(item => {
                if (item.id === data.id)
                    item.lang.en = data.lang.en
            })
        },
        translateAll(data: { wordList: WordListItem[] }) {
            this.wordList = data.wordList
        },
    },
})