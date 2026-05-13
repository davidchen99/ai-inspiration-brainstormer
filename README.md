# 微信公众号标题制作工具

## 文件

- `index.html`：本地网页工具，双击打开使用。
- `sync-to-lark.ps1`：把“下载已选同步 CSV”追加写入飞书多维表格 Base。

## 建议 Base 表结构

表名默认：`公众号选题库`

字段：

- 分类
- 选题
- 标题
- 一句话简介
- 目标读者
- 切入角度
- 标题类型
- 推荐指数
- 推荐理由
- 来源模式
- 状态
- 同步批次
- 创建时间

## 同步流程

1. 在 `index.html` 里生成结果。
2. 勾选要同步的内容。
3. 填写飞书 Base 链接，保存配置。
4. 点击“下载已选同步 CSV”。
5. 在 PowerShell 里运行预览：

```powershell
.\sync-to-lark.ps1 -CsvPath ".\飞书同步-公众号选题库-xxxx.csv" -BaseUrl "你的飞书Base链接" -DryRun
```

6. 确认无误后去掉 `-DryRun`：

```powershell
.\sync-to-lark.ps1 -CsvPath ".\飞书同步-公众号选题库-xxxx.csv" -BaseUrl "你的飞书Base链接"
```

如果表名不是 `公众号选题库`：

```powershell
.\sync-to-lark.ps1 -CsvPath ".\飞书同步-公众号选题库-xxxx.csv" -BaseUrl "你的飞书Base链接" -TableName "你的表名"
```
