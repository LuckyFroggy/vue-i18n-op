import { parse } from '@babel/parser'
import type { NodePath } from '@babel/traverse'
import traverse from '@babel/traverse'
import type { ExportDefaultDeclaration, Expression, Identifier, ObjectExpression, ObjectMethod, ObjectProperty, PrivateName, SpreadElement } from '@babel/types'
import { isIdentifier, isObjectExpression, isObjectProperty, isStringLiteral } from '@babel/types'
import LangParser from './base'

export default class EcmascriptLangParser extends LangParser {
    async findMatchKeys(langPath: string, word: string): Promise<string[]> {
        this._word = word
        this._keys = []
        const code = this.getCode(langPath) || 'export default { }'
        const ast = parse(code, {
            sourceType: 'unambiguous',
        })
        const declarationStrategy: Record<string, (p: NodePath, path: NodePath<ExportDefaultDeclaration>) => void> = {
            Identifier: this.traverseIdentifier.bind(this),
            ObjectExpression: this.traverseObjectExpression.bind(this),
        }
        traverse(ast, {
            Program: {
                enter(p) {
                    p.traverse({
                        ExportDefaultDeclaration(path) {
                            declarationStrategy[path.node.declaration.type](p, path)
                        },
                    })
                },
            },
        })

        return this._keys
    }

    private traverseIdentifier(p: NodePath, path: NodePath<ExportDefaultDeclaration>) {
        const self = this
        const IdentifierName = (path.node.declaration as Identifier).name
        p.traverse({
            VariableDeclarator(path) {
                if (isIdentifier(path.node.id) && path.node.id.name === IdentifierName && isObjectExpression(path.node.init)) {
                    const { properties } = path.node.init
                    self.traverseProperties(properties)
                    // 后续操作
                }
                else {
                    throw new Error('翻译文件代码格式有误！')
                }
            },
        })
    }

    private traverseObjectExpression(p: NodePath, path: NodePath<ExportDefaultDeclaration>) {
        const { properties } = path.node.declaration as ObjectExpression
        this.traverseProperties(properties)
    }

    private traverseProperties(properties: (ObjectProperty | ObjectMethod | SpreadElement)[], parentKey = '') {
        properties.forEach(property => {
            if (isObjectProperty(property)) {
                if (isObjectExpression(property.value)) {
                    const key = this.flttenKey(property.key, parentKey)
                    const { properties } = property.value
                    this.traverseProperties(properties, key)
                }
                else {
                    // 如果是非对象表达式，则直接判断是否与传过来的data的key存在相同
                    const key = this.flttenKey(property.key, parentKey)
                    if (isStringLiteral(property.value) && property.value.value === this._word)
                        this._keys.push(key)
                }
            }
        })
    }

    // 平铺国际化文件中的key，用于和传过来的比较是否重复
    private flttenKey(node: Expression | PrivateName, parentKey: string) {
        let key = ''
        if (isStringLiteral(node))
            key = !parentKey ? node.value : `${parentKey}.${node.value}`

        else if (isIdentifier(node))
            key = !parentKey ? node.name : `${parentKey}.${node.name}`
        return key
    }
}