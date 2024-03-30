// 参考Vue-I18n插件实现的注释功能
import * as vscode from 'vscode'
import { debounce } from 'lodash'
import LocaleDir from './LocaleDir'
import { commands } from 'vscode'
import * as global from '../utils/global'
import Config from './Config'
let textEditorDecorationType: vscode.TextEditorDecorationType | undefined = undefined

let unuseDecorationType: vscode.TextEditorDecorationType | undefined = undefined

class Annotation {
  KEY_REG = /(?:\$t|\$tc|\$d|\$n|\$te|this\.t|i18n\.t|[^\w]t)\(['"]([^]+?)['"]/g
  disposables: vscode.Disposable[] = []

  constructor() {
    const { disposables } = this
    const debounceUpdate = debounce(() => this.update(), 800)

    disposables.push(
      vscode.window.onDidChangeActiveTextEditor(debounceUpdate),
      vscode.workspace.onDidChangeTextDocument(debounceUpdate),
      commands.registerCommand(`${global.EXTENSION_NAME}.showChineseAnnotation`, () => this.showChineseAnnotation()),
      commands.registerCommand(`${global.EXTENSION_NAME}.hideChineseAnnotation`, () => this.hideChineseAnnotation())
    )
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(`${global.EXTENSION_NAME}.chineseAnnotationVisible`)) {
        if(!Config.chineseAnnotationVisible){
          textEditorDecorationType?.dispose()
          unuseDecorationType?.dispose()
        }else{
          this.update()
        }
        
      }
  });
  }

  showChineseAnnotation(){
    Config.set('chineseAnnotationVisible', true)
  }

  hideChineseAnnotation(){
    Config.set('chineseAnnotationVisible', false)
  }

  async update() {

    const activeTextEditor = vscode.window.activeTextEditor
    if (!activeTextEditor || !Config.chineseAnnotationVisible) {
      return
    }
    textEditorDecorationType?.dispose()
    unuseDecorationType?.dispose()
    textEditorDecorationType = vscode.window.createTextEditorDecorationType(
      {}
    )
    
    unuseDecorationType = vscode.window.createTextEditorDecorationType({
      opacity: '0.6'
    })
    

    const { document } = activeTextEditor
    const text = document.getText()
    const decorations = []
    const unuseDecorations = []

    activeTextEditor.setDecorations(unuseDecorationType, [])
    activeTextEditor.setDecorations(textEditorDecorationType, [])

    // 从文本里遍历生成中文注释
    let match = null
    while ((match = this.KEY_REG.exec(text))) {
      const index = match.index
      const matchKey = match[0]
      const key = matchKey.replace(new RegExp(this.KEY_REG), '$1')
      let mainText = await LocaleDir.findLangByKey(key);
      const range = new vscode.Range(
        document.positionAt(index),
        document.positionAt(index + matchKey.length + 1)
      )
      const decoration = {
        range,
        renderOptions: {
          after: {
            color: 'rgba(153, 153, 153, .7)',
            contentText: mainText ? `›${mainText}` : '',
            fontWeight: 'normal',
            fontStyle: 'normal'
          }
        }
      }

      // // 没有翻译的文案透明化处理
      if (!mainText) {
        unuseDecorations.push({ range })
        activeTextEditor.setDecorations(unuseDecorationType, unuseDecorations)
      }

      decorations.push(decoration)
      activeTextEditor.setDecorations(textEditorDecorationType, decorations)
    }
  }

}

export const annotationDisposables = () => {
  const annotation = new Annotation()
  return annotation.disposables
}

