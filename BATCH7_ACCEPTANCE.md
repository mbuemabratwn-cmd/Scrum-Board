# Batch 7 验收记录

日期：2026-03-13

## 自动化与本地检查

1. 顶栏统计口径：`今日新增 / 进行中 / 本周完成`（通过）
2. 任务卡标题单行截断、描述双行截断（通过）
3. 截止日期视觉：3 天内琥珀、过期珊瑚红底（通过）
4. 全局快捷键：`Cmd/Ctrl + N` 新建、`Esc` 关闭弹层（通过）
5. 通知设置菜单（四类开关）本地持久化（通过）
6. 通知权限拒绝提示条可关闭（通过）
7. TypeScript 检查：`npx tsc -p tsconfig.app.json --noEmit`（通过）
8. 代码规范检查：`npm run lint`（通过）
9. 构建检查：`npm run build`（通过）

## 需外部环境验证

10. Firebase 规则部署与未登录拒绝访问（待控制台部署后验证）
11. macOS `.dmg` 打包（当前会话受限：无法访问 GitHub 下载 dmg-builder 依赖；`release/` 已有历史包 `DuiWei Scrum Board-0.0.0-arm64.dmg`）
12. Windows `.exe` 打包（受限：当前环境无法访问 GitHub 下载 Electron Windows 包）

## 备注

- 本地已提供规则文件：`firebase.database.rules.json`
- 打包命令已就绪：
  - `npm run build:mac`
  - `npm run build:win`
- 若在可联网环境执行上述命令，可生成安装包到 `release/`。
