#!/bin/bash

# 设置环境变量
export NODE_ENV=production

# 如果需要，设置内存限制
export NODE_OPTIONS="--max-old-space-size=4096"

# 如果想要绕过sharp警告，可以设置以下环境变量
export NEXT_SHARP_PATH=false

# 启动应用
echo "正在启动应用..."
pnpm next start 