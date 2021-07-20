const Koa = require('koa')
const fs = require('fs')
const path = require('path')
const compilerSFC = require('@vue/compiler-sfc')
const compilerDOM = require('@vue/compiler-dom')
const app = new Koa()

app.use(async ctx => {
    const {url, query} = ctx.request
    if (url === '/') {
        ctx.type = 'text/html'
        ctx.body = fs.readFileSync(path.join(__dirname, './index.html'), 'utf-8')
    } else if (url.endsWith('.js')) {
        const p = path.join(__dirname, url)
        ctx.type = 'application/javascript'
        ctx.body = rewriteImport(fs.readFileSync(p, 'utf8'))
    } else if (url.startsWith('/@modules/')) {
        // 裸模块名称
        const moduleName = url.replace('/@modules/', '')
        const prefix = path.join(__dirname, './node_modules/', moduleName)
        // 获取 package.json 里的 module字段
        const module = require(prefix+'/package.json').module
        const filePath = path.join(prefix, module)
        const result = fs.readFileSync(filePath, 'utf-8')
        ctx.type = 'application/javascript'
        ctx.body = rewriteImport(result)
    } else if (url.indexOf('.vue') > -1) {
        // 获取文件路径
        const p = path.join(__dirname , url.split('?')[0])
        const result = compilerSFC.parse(fs.readFileSync(p, 'utf-8'))
        if (!query.type) {
            // sfc 处理
            // 获取脚本内容
            const scriptContent = result.descriptor.script.content
            // 替换 scriptContent 为一个常量 方便后续修改
            const script = scriptContent.replace('export default', 'const __script = ')
            ctx.type = 'application/javascript'
            ctx.body = `
            ${rewriteImport(script)}
            import {render as __render} from '${url}?type=template'
            __script.render = __render
            export default __script
        `
        } else if (query.type === 'template'){
            const tpl = result.descriptor.template.content
            // 编译为render
           const render = compilerDOM.compile(tpl, {mode: 'module'}).code
            ctx.type = 'application/javascript'
            ctx.body = rewriteImport(render)
        }
    }

})

// 裸模块地址重写
function rewriteImport(content) {
    return content.replace(/ from ['"](.*)['"]/g, function (s1, s2) {
        if (s2.startsWith('./') || s2.startsWith('../') || s2.startsWith('/')) {
            return s1
        } else {
            return ` from '/@modules/${s2}'`
        }
    })
}

app.listen(3000, () => {
    console.log('localhost:3000')
})
