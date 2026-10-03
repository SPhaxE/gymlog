# APK

`main` 每次更新后，GitHub Actions 的 CI 会把打包好的 debug APK 提交到这里：

- `milo-debug.apk`：最新一版，直接下载安装即可（手机上需允许「安装未知来源应用」）。
- `BUILD.md`：这一版对应的源提交、构建时间和工作流链接。

只保留最新一个文件；旧版本在 git 历史里。PR 上的构建不会提交到这里，去对应工作流的 Artifacts 里下载 `milo-debug-apk`。
