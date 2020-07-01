<template>
  <div class="app-html">
    <img :src="logo" />
    <h1>Vue-di18n</h1>
    <p>Happly coding here ~</p>
    <div>
      <!-- di18n-disable -->
      <button @click="changeLocale('zh-CN')">中文</button>
      <!-- di18n-enable -->
      <button @click="changeLocale('en-US')">English</button>
    </div>
    <p>{{ $t('中文中文哈哈') }}</p>
    <p>{{ $t('嘻嘻哈哈嘻嘻') }}</p>
    <p>{{ haha }}</p>
    <Switch>{{ $t('汉子') }}</Switch>
    <Circle>{{ $t('呼呼呼啦啦') }}</Circle>
  </div>
</template>

<script>
import { intl, setLocale } from 'di18n-vue'
import Logo from './EFE-logo.png'

export default {
  name: 'app-html',
  data() {
    return {
      logo: Logo,
      haha: intl.$t('哈哈'),
    }
  },
  methods: {
    changeLocale(locale) {
      setLocale(locale, true)
    },
  },
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
