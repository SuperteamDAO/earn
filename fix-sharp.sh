#!/bin/bash

echo "开始修复Sharp模块..."

# 删除当前的sharp模块
echo "删除现有的sharp模块..."
rm -rf node_modules/.pnpm/sharp*
rm -rf node_modules/sharp

# 安装系统级依赖
echo "安装系统级依赖..."
if command -v apt-get &> /dev/null; then
  sudo apt-get update
  sudo apt-get install -y build-essential libvips-dev
elif command -v yum &> /dev/null; then
  sudo yum install -y gcc-c++ vips-devel
elif command -v apk &> /dev/null; then
  apk add --no-cache build-base vips-dev
fi

# 尝试重新安装sharp
echo "重新安装sharp模块..."
npm install --platform=linux --arch=x64 sharp

# 如果失败，尝试详细安装
if [ $? -ne 0 ]; then
  echo "尝试详细模式安装sharp..."
  npm install --ignore-scripts=false --foreground-scripts --verbose sharp
fi

# 如果仍然失败，使用特定版本
if [ $? -ne 0 ]; then
  echo "尝试安装指定版本的sharp..."
  npm install sharp@0.32.6
fi

# 最后尝试用pnpm重新构建
echo "尝试使用pnpm重新构建sharp..."
pnpm rebuild sharp

echo "Sharp修复完成，请尝试重新构建和启动应用。" 