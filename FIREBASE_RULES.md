# Firebase 安全规则部署（Realtime Database）

## 目标

- 仅登录用户可读写任务与在线状态。
- 未登录请求返回 `Permission denied`。

## 规则内容

将以下规则粘贴到 Firebase Console -> Realtime Database -> 规则：

```json
{
  "rules": {
    "tasks": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "status": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

同内容也保存在：`firebase.database.rules.json`

## 验证步骤

1. 在浏览器无登录态访问：
   - `https://<your-db>.firebasedatabase.app/tasks.json`
2. 预期返回：
   - `Permission denied`
3. 在应用内登录后，任务读写恢复正常。
