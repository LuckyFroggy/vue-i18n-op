
<center><img src="/assets/icon-vue-i18n-op.png" width="30%"></center>

 # <center> Vue I18n OP
------
<center>在开发过程中，频繁的人工翻译和替换中文真的很累有木有！😩</center>
<center>此刻的你一定也和我有着相同的烦恼，才让我们在这里相遇！👨🏻‍🤝‍👨🏼</center>
<center>这是一款辅助开发者快速编写与替换Vue I18n的工具🚀</center>
## 主要能力

* **支持Vue/Vue3（Options API/组合式API）**
* **支持JavaScript/TypeScript文件的翻译**
* **支持一键替换当前文件文本**
* **支持设置文本保存的路径**
* **支持以js/ts/json类型保存**

## 效果展示

``` vue
// 替换前
<template>
  <div text="姓名" :attr="'年龄' + age">
    <p>自动国际化</p>
    <p>{{ "测试文本" }}{{ `星期一` }}</p>
    <el-input
      :data="{ placeholder: '请输入', other: `其他信息${company}` }"
    ></el-input>
    <p>{{ "字符串：" + getDepartment("部门") }}</p>
    <p>{{ `模板字符串：${getDepartment("部门")}` }}</p>
  </div>
</template>

<script>
export default {
  props: {},
  data() {
    return {
      age: 12,
      company: "浙江某公司",
      department: "大数据研究院",
    };
  },
  methods: {
    getDepartment(text) {
      let str = "测试";
      return `${text}是${this.department}`;
    },
  },
};
</script>

```
``` vue
// 替换后
<template>
  <div :text="$t('data.Qkhn5Pdi')" :attr="$t('data.e3KR2je4') + age">
    <p>{{$t('data.iifYXS54')}}</p>
    <p>{{ $t('data.JMQ8dNjn') }}{{ `${$t('data.8t3mAiGi')}` }}</p>
    <el-input
      :data="{ placeholder: $t('data.6MRmxCTk'), other: `${$t('data.cSXz37n7')}${company}` }"
    ></el-input>
    <p>{{ $t('data.G6fFm5P5') + getDepartment($t('data.5RJktc33')) }}</p>
    <p>{{ `${$t('data.6Q5TyCMm')}${getDepartment($t('data.5RJktc33'))}` }}</p>
  </div>
</template>

<script>
export default {
  props: {},
  data() {
    return {
      age: 12,
      company: this.$t('data.QJ5zSbWH'),
      department: this.$t('data.YpKNk7y4'),
    };
  },
  methods: {
    getDepartment(text) {
      let str = this.$t('data.r4x67Gif');
      return `${text}${this.$t('data.Aj3SfHED')}${this.department}`;
    },
  },
};
</script>
```
* 翻译面板
  <img src="/assets/open.png">
* 配置文件
<img src="/assets/js.png">
<img src="/assets/json.png">

## 如何使用
  **打开翻译面板**
  可以通过右键打开或右上方 <img src="/assets/icont.png" width="5%"> 按钮打开
![](assets/open.gif)
  **设置i18n文件目录**
  首次会自动弹出设置，也可通过 **⌘/Ctrl+Shift+P** 查找 **vue-i18n-op** 设置
![](assets/set.gif)
  **保存翻译**
![](assets/save.gif)
  **替换文件**
![](assets/replace.gif)

## 感谢观看与使用
如果有任何吐槽或问题，欢迎提问和建议，邮箱地址（[297799265@qq.com]()）