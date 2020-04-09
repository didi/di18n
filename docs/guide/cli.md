# 命令

## di18n init

初始化配置，并生成 di18n.config.js 文件，只需执行一次。

## di18n sync

自动将源码里的中文替换成国际化标记，并更新国际化配置。

## di18n publish

将国际化资源发布上线，仅适用国际化资源存放到服务端的情况，如果存放在本地文件，此命令实际不做任何事情。

## di18n convert

将非 react-intl-universal 代码转换成 react-intl-universal 形式，即类似 `intl.get('key1').d('标题')`。

## di18n convert2

在 `di18n convert` 的基础上，将代码转换成 di18n 形式，即 `intl.t('key1').d('标题')`。
