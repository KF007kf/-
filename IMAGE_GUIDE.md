# 图片公开显示规则

要让别人看到图片，图片必须跟着网站一起进入 GitHub 仓库。

推荐流程：

1. 把图片放到 `assets/images/user-reviews/`、`assets/images/covers/` 或 `assets/images/uploads/`。
2. 文件名用英文，例如 `after-rain-terminal-cover.jpg`。
3. 在 `data/site-data.js` 里引用它：`./assets/images/covers/after-rain-terminal-cover.jpg`。
4. 提交并推送到 GitHub。
5. GitHub Pages 重新部署后，别人就能看到。

现在的测评图推荐三份：

- `xxx-thumb.jpg`: 首页卡片小图，几百 KB 以内最好。
- `xxx-display.jpg`: 文章里展示的大图，控制在 1MB 左右比较舒服。
- `xxx.png`: 原始长图，作为档案图保留，可以从文章里打开。

不要使用：

- 电脑本地路径，例如 `C:\Users\...\Desktop\cover.jpg`
- 浏览器临时上传出来的 `blob:` 地址
- 需要登录才能访问的网盘图片

内容建议：

- 不放盗版下载链接。
- 不放露骨图片作为公开封面。
- 不收录或暗示未成年人相关内容。
