#!/bin/bash

# 下载依赖
go mod tidy

# 构建并运行服务器
go run cmd/server/main.go
