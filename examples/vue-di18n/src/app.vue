<template lang="pug">
div(class="app")
  img(:src="logo")
  h1 Vue-di18n
  p Happly coding here ~
  div
    // di18n-disable
    button(@click="changeLocale('zh-CN')") 中文
    // di18n-enable
    button(@click="changeLocale('en-US')") English
  p {{$t('中文')}}
  p {{haha}}
</template>

<script>
import { intl, setLocale } from 'di18n-vue'
import Logo from './EFE-logo.png'

export default {
  name: 'app',
  data() {
    return {
      logo: Logo,
      haha: intl.$t('哈哈')
    }
  },
  methods: {
    changeLocale(locale) {
      setLocale(locale, true)
    }
  }
}
</script>

<style lang="less">
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
