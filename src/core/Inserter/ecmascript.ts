import { parse } from '@babel/parser'
import type { NodePath } from '@babel/traverse'
import traverse from '@babel/traverse'
import type { ExportDefaultDeclaration, Expression, Identifier, ObjectExpression, ObjectMethod, ObjectProperty, PrivateName, SpreadElement, VariableDeclarator } from '@babel/types'
import { identifier, isIdentifier, isObjectExpression, isObjectProperty, isStringLiteral, objectProperty, stringLiteral } from '@babel/types'
import Inserter from './base'
import generate from '@babel/generator'
import { writeFileSync } from 'fs'
import { window } from 'vscode'
export default class EcmascriptInserter extends Inserter {
    quotesType: 'single' | 'double' = 'single' // 插入时
    async insert(langPath: string, data: any) {
        this.data = data
        const originCode = this.getCode(langPath) || 'export default { }'
        const ast = parse(originCode, {
            sourceType: 'unambiguous',
        })
        const declarationStrategy: Record<string, (p: NodePath, path: NodePath<ExportDefaultDeclaration>) => void> = {
            Identifier: this.traverseIdentifier.bind(this),
            ObjectExpression: this.traverseObjectExpression.bind(this),
        }
        // 先找ExportDefaultDeclaration，判断是对象表达式，还是标识符，如果是对象表达式则直接遍历内部，如果是标识符则先找到对应变量的表达式，找不到就报错提示
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
            StringLiteral: (path) => {
                if (path.node.extra) {
                    const { raw } = path.node.extra
                    if ((raw as string).startsWith('\"'))
                        this.quotesType = 'double'
                    else
                        this.quotesType = 'single'
                }
            },
        })

        const { code } = generate(ast, {
            compact: 'auto',
            jsescOption: {
                minimal: true,
                quotes: this.quotesType,
            },
        }, originCode)

        writeFileSync(this.getAbsoultePath(langPath), code)
        window.showInformationMessage('保存成功！')
        return { status: 'success', msg: '保存成功！' }
    }

    private traverseIdentifier(p: NodePath, path: NodePath<ExportDefaultDeclaration>) {
        const self = this
        const IdentifierName = (path.node.declaration as Identifier).name
        p.traverse({
            VariableDeclarator(path) {
                if (isIdentifier(path.node.id) && path.node.id.name === IdentifierName && isObjectExpression(path.node.init)) {
                    const { properties } = path.node.init
                    self.handleProperties(properties)
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
        this.handleProperties(properties)
    }

    private handleProperties(properties: (ObjectMethod | ObjectProperty | SpreadElement)[]) {
        this.traverseProperties(properties)
        Object.keys(this.data).forEach((key: string) => {
            properties.push(objectProperty(stringLiteral(key), stringLiteral(this.data[key])))
        })
    }

    traverseProperties(properties: (ObjectProperty | ObjectMethod | SpreadElement)[], parentKey = '') {
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
                    this.isExistKey(key) && Reflect.deleteProperty(this.data, key) // 删除data中重复的key
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