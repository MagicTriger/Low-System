# 切换到 GitHub SSH 配置

## 当前状态

当前仓库配置：

- Remote: `git@git.alfadb.cn:kenon/mes/client.git`
- 这是公司内部 Git 服务器

## 切换步骤

### 1. 确认你的 GitHub 仓库地址

你需要知道你的 GitHub 仓库 SSH 地址，格式如下：

```
git@github.com:你的用户名/仓库名.git
```

### 2. 添加 GitHub SSH 密钥

你的 SSH 公钥：

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIE7O0HhcazV/C10Wu7pjw+SGh5e2eIRVOaf4EazVEL74 tax1682022@163.com
```

请将此公钥添加到 GitHub：

1. 访问 https://github.com/settings/keys
2. 点击 "New SSH key"
3. 粘贴上面的公钥
4. 保存

### 3. 测试 GitHub SSH 连接

```cmd
ssh -T git@github.com
```

成功的话会看到：

```
Hi username! You've successfully authenticated, but GitHub does not provide shell access.
```

### 4. 切换远程仓库地址

有两种方式：

#### 方式 A: 更改现有 origin（推荐）

```cmd
git remote set-url origin git@github.com:你的用户名/仓库名.git
```

#### 方式 B: 添加新的 remote

```cmd
git remote add github git@github.com:你的用户名/仓库名.git
```

### 5. 验证配置

```cmd
git remote -v
```

应该看到：

```
origin  git@github.com:你的用户名/仓库名.git (fetch)
origin  git@github.com:你的用户名/仓库名.git (push)
```

### 6. 推送到 GitHub

```cmd
git push origin main
```

或者：

```cmd
git push origin master
```

## 保留两个远程仓库

如果你想同时保留公司 Git 和 GitHub，可以这样配置：

```cmd
# 保持 origin 为公司 Git
# 添加 github 作为第二个远程仓库
git remote add github git@github.com:你的用户名/仓库名.git

# 推送到公司 Git
git push origin main

# 推送到 GitHub
git push github main
```

## 需要的信息

请提供你的 GitHub 仓库信息：

- GitHub 用户名：?
- 仓库名：?

完整的 SSH 地址格式：`git@github.com:用户名/仓库名.git`
