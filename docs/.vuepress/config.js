module.exports = {
  title: 'di18n',
  description: '自动转换、基于配置的前端国际化方案',
  base: '/github/',
  themeConfig: {
    repo: 'https://github.com/didi/di18n.git',
    repoLabel: 'Github',
    nav: [
      { text: '指南', link: '/guide/' },
      { text: '配置', link: '/config/' },
      { text: '常见问题', link: '/FAQ/' }
    ],
    sidebar: {
      '/guide/': [
        {
          title: '指南',
          collapsable: false,
          children: ['', 'how'],
        },
        {
          title: '起步',
          collapsable: false,
          children: ['get-started'],
        },
        {
          title: 'CLI',
          collapsable: false,
          children: ['cli'],
        },
        {
          title: 'React',
          collapsable: false,
          children: ['react-provider', 'react-get-set', 'react-demo'],
        },
        {
          title: 'Vue',
          collapsable: false,
          children: ['vue'],
        },
      ],
      '/faq/': [''],
      '/config/': [''],
    },
  },
};
