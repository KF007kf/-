# ReviewFork NTRGAME Blog

一个可以直接部署到 GitHub Pages 的静态测评博客。设计方向参考你给的原型和测评长图：Pitchfork 式大标题、黑红硬边框、评分圆章、规格表、人物目录、雷达评分、榜单和新作前瞻。
现在也包含一个站内的“年度牛油排名”工具，可以按年份做 Tier List、上传图片、拖拽排序并保存。

## 怎么改内容

主要改这个文件：

```text
data/site-data.js
```

更细的自定义说明在：

```text
CUSTOMIZE.md
```

每篇测评都在 `reviews` 数组里。复制一段已有文章，改：

- `slug`: 文章唯一地址，只用英文、数字和短横线
- `title` / `titleCn`: 英文名和中文名
- `studio` / `type` / `releaseDate`
- `cover`: 封面图片路径
- `displayCover` / `poster`: 文章展示图和原始排版长图
- `coverHasScore`: 标题裁切图里已经有评分圈时设为 `true`
- `rating`: 评分
- `tags`: 标签
- `specs`: 时长、CG 数、场景数等
- `scores`: 雷达评分和每项短评
- `directories`: 女主一览、间男一览
- `body`: 正文段落

年度排名的默认公开数据在 `annualTier.boards` 里。网页上的“保存”会保存到你的浏览器；排好后建议用“导出 JSON”备份。要让所有访客都看到你排好的版本，需要把导出的 JSON 合进 `data/site-data.js` 后再发布。

## 怎么放图片

公开图片放在：

```text
assets/images/covers/
assets/images/characters/
assets/images/uploads/
assets/images/user-reviews/
```

然后在 `data/site-data.js` 里写相对路径，例如：

```js
cover: "./assets/images/covers/my-game-cover.jpg"
```

不要写 `C:\Users\...\Desktop\xxx.jpg` 这种本地路径。别人访问网页时看不到你电脑里的图片。

## 怎么发布

这个项目已经带了 GitHub Pages workflow：

```text
.github/workflows/pages.yml
```

推到 GitHub 后，在仓库 Settings -> Pages 里选择 GitHub Actions。之后每次推送到 `main`，网页会自动更新。

## 点赞和投票

点赞和投票模块已经做好。默认是本地预览模式；要让所有访客看到同一份结果，需要配置 Firebase：

```text
FIREBASE_SETUP.md
```

## GSAP 动画

页面入场、滚动出现、悬停、弹窗、点赞和投票反馈都通过 GSAP 控制。动画强度在 `data/site-data.js` 的 `site.animation` 里调。

## 原型文件

你给的两个 HTML 已保留在：

```text
reference/ReviewFork_Pitchfork研究重设计版.html
reference/新作前瞻.html
```

正式网站没有直接依赖这两个大文件，它们作为设计参考归档。
