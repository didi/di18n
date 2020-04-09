# 使用

## 安装

使用前请将 di18n-cli 安装到 devDependencies 里，也可以全局安装。

```bash
$ npm install -D di18n-cli

# or

$ yarn add -D di18n-cli
```

## 初始化

在执行转换前需要先初始话一下配置，此步骤只需执行一次。

```bash
$ di18n init
```

## 同步

该命令能自动将源码里的中文替换成国际化标记，并更新国际化配置。

```
$ di18n sync
```


## 发布

```
$ di18n publish
```

将国际化资源发布上线，仅适用国际化资源存放到服务端的情况，如果存放在本地，此命令实际不做任何事情。
