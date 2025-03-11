# 服务器部署指南

这个文档提供了在服务器上部署此Next.js应用的指南，特别解决了构建过程中的Sharp模块和内存溢出问题。

## 问题描述

部署过程中可能遇到两个主要问题：

1. Sharp模块加载失败：用于图像处理的Sharp模块在Linux服务器上可能无法正确加载
2. JavaScript堆内存溢出：构建过程可能会耗尽Node.js的默认内存限制

## 解决方案

我们提供了几个脚本来解决这些问题：

### 1. 修复Sharp模块

运行以下命令：

```bash
./fix-sharp.sh
```

这个脚本会：
- 删除现有的Sharp模块
- 安装必要的系统级依赖
- 尝试几种不同的方法重新安装Sharp

### 2. 使用增加内存限制的构建脚本

运行以下命令进行构建：

```bash
./build-server.sh
```

这个脚本会：
- 设置Node.js内存限制到8GB
- 尝试安装适合Linux环境的Sharp
- 运行生产构建

### 3. 启动应用

构建成功后，运行以下命令启动应用：

```bash
./start-server.sh
```

## Docker方案

如果以上方法仍然不起作用，我们还提供了一个Dockerfile，可以通过以下命令使用：

```bash
# 构建Docker镜像
docker build -t bounty-earn .

# 运行容器
docker run -p 3000:3000 bounty-earn
```

## 手动解决步骤

如果脚本不起作用，您也可以手动尝试以下步骤：

1. 增加Node.js内存限制：
   ```bash
   export NODE_OPTIONS="--max-old-space-size=8192"
   ```

2. 安装系统级依赖：
   ```bash
   sudo apt-get update
   sudo apt-get install -y build-essential libvips-dev
   ```

3. 重新安装Sharp：
   ```bash
   rm -rf node_modules/sharp
   npm install --platform=linux --arch=x64 sharp
   ```

4. 如果上述方法失败，尝试详细安装：
   ```bash
   npm install --ignore-scripts=false --foreground-scripts --verbose sharp
   ```

5. 构建应用：
   ```bash
   pnpm next build
   ```

6. 启动应用：
   ```bash
   NODE_ENV=production pnpm next start
   ```

## 故障排除

- 如果您遇到"Cannot find module '../build/Release/sharp-linux-x64.node'"错误，这通常意味着Sharp没有为您的操作系统正确编译。
- 如果遇到"JavaScript heap out of memory"错误，需要增加NODE_OPTIONS中的内存限制。
- 查看日志文件以获取更详细的错误信息：`~/.npm/_logs/` 