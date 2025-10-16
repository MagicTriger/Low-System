# GitHub SSH 连接设置指南

## 步骤 1: 检查现有 SSH 密钥

首先检查是否已经有 SSH 密钥：

```cmd
dir %USERPROFILE%\.ssh
```

如果看到 `id_rsa.pub` 或 `id_ed25519.pub` 文件，说明已有密钥，可以跳到步骤 3。

## 步骤 2: 生成新的 SSH 密钥

如果没有密钥，生成一个新的：

```cmd
ssh-keygen -t ed25519 -C "your_email@example.com"
```

或者使用 RSA（如果系统不支持 Ed25519）：

```cmd
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

按提示操作：

- 按 Enter 接受默认文件位置
- 输入密码（可选，建议设置）
- 再次输入密码确认

## 步骤 3: 启动 SSH Agent

```cmd
start-ssh-agent
```

或者手动启动：

```cmd
ssh-agent
```

## 步骤 4: 添加 SSH 密钥到 Agent

```cmd
ssh-add %USERPROFILE%\.ssh\id_ed25519
```

或者如果使用 RSA：

```cmd
ssh-add %USERPROFILE%\.ssh\id_rsa
```

## 步骤 5: 复制 SSH 公钥

```cmd
type %USERPROFILE%\.ssh\id_ed25519.pub
```

或者：

```cmd
type %USERPROFILE%\.ssh\id_rsa.pub
```

复制输出的整个内容（从 `ssh-ed25519` 或 `ssh-rsa` 开始到邮箱结束）。

## 步骤 6: 添加 SSH 密钥到 GitHub

1. 登录 GitHub
2. 点击右上角头像 → Settings
3. 左侧菜单选择 "SSH and GPG keys"
4. 点击 "New SSH key"
5. 填写：
   - Title: 给密钥起个名字（如 "Work Laptop"）
   - Key: 粘贴刚才复制的公钥
6. 点击 "Add SSH key"

## 步骤 7: 测试 SSH 连接

```cmd
ssh -T git@github.com
```

如果成功，会看到类似消息：

```
Hi username! You've successfully authenticated, but GitHub does not provide shell access.
```

## 步骤 8: 配置 Git 仓库使用 SSH

### 如果是新仓库（克隆）

```cmd
git clone git@github.com:username/repository.git
```

### 如果是现有仓库（切换到 SSH）

查看当前远程 URL：

```cmd
git remote -v
```

如果显示 HTTPS URL（如 `https://github.com/username/repository.git`），切换到 SSH：

```cmd
git remote set-url origin git@github.com:username/repository.git
```

验证更改：

```cmd
git remote -v
```

## 步骤 9: 测试推送

```cmd
git push origin main
```

或者：

```cmd
git push origin master
```

## 常见问题

### 问题 1: Permission denied (publickey)

**解决方案：**

- 确认 SSH 密钥已添加到 GitHub
- 确认 SSH agent 正在运行
- 重新添加密钥到 agent：`ssh-add %USERPROFILE%\.ssh\id_ed25519`

### 问题 2: Could not open a connection to your authentication agent

**解决方案：**
启动 SSH agent：

```cmd
start-ssh-agent
```

### 问题 3: Host key verification failed

**解决方案：**
首次连接时接受 GitHub 的主机密钥：

```cmd
ssh -T git@github.com
```

输入 `yes` 确认。

## 快速命令参考

```cmd
# 生成密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 查看公钥
type %USERPROFILE%\.ssh\id_ed25519.pub

# 测试连接
ssh -T git@github.com

# 切换到 SSH
git remote set-url origin git@github.com:username/repository.git

# 推送代码
git push origin main
```

## 下一步

现在你可以：

1. 使用 `git push` 推送代码到 GitHub
2. 使用 `git pull` 拉取最新代码
3. 不再需要每次输入用户名和密码

## 安全提示

- 不要分享私钥文件（`id_ed25519` 或 `id_rsa`）
- 只分享公钥文件（`.pub` 后缀）
- 为 SSH 密钥设置密码以增加安全性
- 定期轮换 SSH 密钥
