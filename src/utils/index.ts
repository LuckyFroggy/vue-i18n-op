export const regExpExistChinese = /[\u4E00-\u9FA5]+/m
export const regExpQuotes = /['"]/g
export function randomString(e = 8) {
    // 随机字符串
    const t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678"
    const a = t.length
    let n = ""
    for (let i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a))
    return n
}
