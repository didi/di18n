<template lang="pug">
.app
  img(:src="logo")
  h1 Vue-di18n
  p Happly coding here ~
  div
    // di18n-disable
    button(@click="changeLocale('zh-CN')") 中文
    // di18n-enable
    button(@click="changeLocale('en-US')") English
  p 中文
  p 哈哈哈哈
  button(disabled) 禁用按钮
</template>
<script>
import Logo from './EFE-logo.png'

export default {
  name: 'app',
  data() {
    return {
      logo: Logo,
      name: '中文'
    }
  },
  methods: {
    changeLocale(locale) {
      this.$i18n.locale = locale
    }
  }
}
</script>
<style lang="less" scoped>
html {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

body {
  padding: 0;
  background-color: #fff;
}

.app {
  text-align: center;

  img {
    width: 200px;
  }
}
</style>
