import Vue from 'vue'
import { intl, getLocale, VueI18n } from 'di18n-vue'
import App from './app'
import zhCN from '../locales/zh-CN.json'
import enUS from '../locales/en-US.json'

Vue.use(VueI18n)

const i18n = new VueI18n({
  locale: getLocale(),
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

intl.init(i18n)

/* eslint-disable no-new */
new Vue({
  el: '#root',
  i18n,
  render: h => h(App)
})
