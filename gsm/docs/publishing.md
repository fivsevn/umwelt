# 用 trigger 发帖

只需修改 [`gsm/trigger.md`](../trigger.md)，和配图一起提交到 Umwelt 仓库的 `main`。Pages 流程会读取新的提交，把每条内容归档成独立文件夹，再发布页面。不会在浏览器里注册或登录，也不区分谁负责哪个角色。

```yaml
---
username: backpackgecko
name: 背包宫
status: published
likes: 0
date: ""
---

出游了。
```

- `username`：英文字母和数字，1–32 位，不写 `@`，不含点、下划线或空格；统一转为小写。同一用户名对应同一个角色和稳定头像。
- `name`：显示昵称，可写中文。已注册角色以角色档案里的名字和头像为准；其他角色使用最近一帖填写的昵称。
- `status`：`published` 公开、`draft` 草稿、`hidden` 隐藏。只有公开帖及其图片进入站点发布包。仓库本身是公开的，源文件仍可在 GitHub 查看。
- `likes`：自定义初始点赞数，例如 `likes: 24`，不填默认 0。填写非负整数；访客在本机点过赞会在此基础上加 1。修改旧帖的数量，直接改对应帖子包里的 `likes`；trigger 用于发布新帖。
- `date`：留空使用提交时间（北京时间）。指定时必须带时区，例如 `"2026-10-19T14:00:00+08:00"`。这是帖子排序时间，不是定时发布功能。

配置区下方填写正文，保留换行。每次有内容变化的提交创建新帖；仅改注释或原样重跑不会重复发帖。再次发送完全一样的内容时填写新的 `date`。不需要先决定使用哪个角色，直接填用户名和昵称。

## 配图与头像

配图放进 `gsm/uploads/`，正文按需要插入多张：

```text
今天的观察位置。

![窗边](uploads/window.jpg)

换一个方向再看看。
```

支持 JPEG、PNG、HEIC、GIF 和 WebP。归档时自动转为 WebP；照片质量 85，PNG/GIF 无损，透明和动画保留；已是 WebP 的文件校验后直接使用。图片保持自己的宽高比例，按正文中的位置显示。原件仍留在上传目录，但旧帖使用自己包里的转换件，不依赖上传目录，也不把原件部署到网页。

未注册的用户名会按名字的稳定散列生成像素守宫头像，输出为 WebP；刷新或重建不会换脸。固定角色在 `gsm/characters/用户名.json` 注册，例如：

```json
{
  "name": "背包宫",
  "avatar_source": "art/backpackgecko/source.png",
  "avatar_pixels": 48,
  "avatar_crop": [0, 178, 800, 978]
}
```

`avatar_source` 相对 `gsm/`；更换原图后构建会自动转 WebP。`avatar_pixels` 可选，将头像降采样为该尺寸的正方形；`avatar_crop` 可选，用原图像素坐标 `[左, 上, 右, 下]` 裁剪。背包宫保留原图，只做裁剪与 48 × 48 降采样，不使用生成式重绘。

## 直接修改旧帖

```text
gsm/posts/2026/10/帖子编号/
  index.md          配置与中文正文，直接修改这里
  index.en.md       可选的英文正文
  index.ja.md       可选的日文正文
  assets/           这条帖子自己的 WebP 配图（有图时生成）
```

编辑旧帖不要改 `id`，这样已有点赞记录继续对应。修改正文、昵称、时间、状态或配图后提交，就更新原帖；也可删除整个帖子包。缺少翻译时显示原文，不要求发帖时填写三遍。用户名、头像、卡片、时间与点赞都由代码排版。

当前所有占位帖都是可替换的守宫日常创作。`likes` 是初始数量，现有占位帖从 0 开始；访问者的点赞仅保存在自己设备上，没有远端点赞服务。

## 本地编辑与核对

首次安装：`python3 -m pip install -r gsm/tools/requirements.txt`。

- 发当前 trigger 并更新本地页面：`python3 gsm/tools/publish.py publish`。
- 仅重建旧帖/角色改动：`python3 gsm/tools/publish.py build`。
- 编辑时自动检查文件变化：`python3 gsm/tools/publish.py watch`，保存后刷新页面；结束时按 Ctrl+C。
- CI 导入尚未处理的提交：`python3 gsm/tools/publish.py ingest`，读取保存的提交位置，逐个归档，不只看最新一条。

`data/feed.mjs`、`assets/avatars/` 与 `.publishing/public.json` 是生成文件。`.publishing/state.json` 保存已处理的位置和最近内容摘要；不要手改或删除，否则可能影响去重。归档包和位置一起保存，损坏或缺失图片会中止发布，不跳过这条内容。

发帖流程沿用 [Flux](https://github.com/fivsevn/fivsevn-flux) 的入口、独立归档包与静态发布方式，另加入用户名、角色档案及自动头像。这里不读取或修改 Flux 的内容。
