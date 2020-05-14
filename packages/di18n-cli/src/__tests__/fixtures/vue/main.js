import Vue from 'vue'
import VueI18n from 'vue-i18n'
import App from './app'
import zhCN from '../locales/zh-CN.json'
import enUS from '../locales/en-US.json'

Vue.use(VueI18n)

const i18n = new VueI18n({
  locale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

/* eslint-disable no-new */
new Vue({
  el: '#root',
  i18n,
  render: h => h(App)
})
