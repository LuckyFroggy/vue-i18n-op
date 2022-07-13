<template>
  <div class="webview-container">
    <header>
      <button class="btn btn-primary" @click="save">保存</button>
      <button class="btn btn-primary" @click="translateAll">一键翻译</button>
    </header>
    <main>
      <div class="word-list" v-if="wordList.length">
        <section
          class="word-item"
          v-for="(item,index) in wordList"
          :key="item.id"
        >
          <div class="word-item-wrap">
            <div class="left">
              <section class="word-form">
                <span>key:</span>
                <input type="text" class="word-form-input" v-model="item.key" />
              </section>
              <section class="word-form">
                <span>en:</span>
                <input
                  type="text"
                  class="word-form-input"
                  v-model="item.lang.en"
                />
              </section>
              <section class="word-form">
                <span>zh:</span>
                <input
                  type="text"
                  class="word-form-input"
                  v-model="item.lang.zh"
                />
              </section>
            </div>
            <div class="right">
              <div>
                <button class="btn btn-primary" @click="translate(item)">翻译</button>
              </div>
              <div>
                <button class="btn btn-default" @click="ignore(index)">忽略</button>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div v-else>暂无可翻译文本</div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, toRefs } from 'vue'
import { useStore } from './stores'
import type { MessageType, WordListItem } from '.'
import _ from 'lodash'
const store = useStore()
// store.loaded()
postMessage('loaded')
const { wordList } = toRefs(store)

onMounted(() => {
    window.addEventListener('message', (event) => {
        handleMessage(event.data)
    })
})

function handleMessage(event: { type: any; data: any }) {
    const { type, data } = event
    store[type](data)
}

function translate(item: WordListItem) {
    postMessage('translate', item)
}

function translateAll() {
    postMessage('translateAll', { wordList: wordList.value })
}

function save() {
    postMessage('save', { wordList: wordList.value })
}
function ignore(index) {
    wordList.value.splice(index, 1)
}
function postMessage(type: MessageType, data = {}) {
    store.vscode.postMessage({
        type,
        data: _.cloneDeep(data),
    })
}
</script>

<style lang="less">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  color: var(--vscode-forground);
}
</style>
<style lang="less">
.webview-container {
  // padding: 0 20px;
  & > header {
    height: 60px;
    line-height: 60px;
  }
  & > main {
    .word-list {
      .word-item {
        margin-bottom: 28px;
        background: var(--vscode-sideBar-background);
        padding: 20px;
        .word-item-wrap {
          display: flex;
          .left {
            flex: 1;
            padding-right: 20px;
            .word-form {
              margin-bottom: 16px;
              display: flex;
              align-items: center;
              &:last-of-type {
                margin-bottom: 0;
              }
              & > span {
                flex-shrink: 0;
                width: 26px;
                text-align: right;
                padding-right: 12px;
              }
              .word-form-input {
                flex: 1;
                width: 100%;
                background: var(--vscode-input-background);
                border: 1px solid var(--vscode-input-border);
                color: var(--vscode-input-foreground);
                height: 24px;
                line-height: 24px;
                padding: 0 6px;
                &:focus,
                &:active {
                  outline: 1px solid var(--vscode-button-background);
                  border-color: var(--vscode-button-background);
                }
              }
            }
          }
          .right {
            padding: 0px;
            flex-shrink: 0;
            margin-left: auto;
            display: flex;
            flex-direction: column;
            justify-content: center;
            &>div{
              padding:10px 0;
            }
          }
        }
      }
    }
  }
  .btn {
    font-size: 12px;
    // color: var(--vscode-textBlockQuote-background);
    background: var(--vscode-button-secondaryBackground);
    border: 1px solid var(--vscode-button-border);
    color: var(--vscode-button-secondaryForeground);
    padding: 4px 20px;
    border-radius: 2px;
    outline: none;
    margin-right: 20px;
    cursor: pointer;
    &.btn-primary {
      background: var(--vscode-button-background);
      border: 1px solid var(--vscode-button-border);
      color: var(--vscode-button-foreground);
      &:hover {
        background: var(--vscode-button-hoverBackground);
      }
    }
    &.btn-default {
      &:hover {
        background: var(--vscode-button-secondaryHoverBackground);
      }
    }
    &:last-of-type {
      margin-right: 0px;
    }
  }
}
</style>
