#!/bin/bash

# 设置Node.js内存限制
export NODE_OPTIONS="--max-old-space-size=8192"

# 尝试安装适合Linux环境的sharp
echo "安装sharp模块..."
npm install --platform=linux --arch=x64 sharp

# 如果上面的方法失败，尝试使用更详细的安装方式
if [ $? -ne 0 ]; then
  echo "使用详细日志方式安装sharp..."
  npm install --ignore-scripts=false --foreground-scripts --verbose sharp
fi

# 如果仍然失败，尝试使用pnpm重新编译
if [ $? -ne 0 ]; then
  echo "尝试使用pnpm重新编译sharp..."
  pnpm rebuild sharp
fi

# 运行生产构建
echo "开始构建应用..."
pnpm next build

# 设置输出状态
BUILD_STATUS=$?

# 输出构建结果
if [ $BUILD_STATUS -eq 0 ]; then
  echo "构建成功! 现在可以通过pnpm next start启动应用。"
else
  echo "构建失败，请检查以上错误信息。"
fi

exit $BUILD_STATUS 