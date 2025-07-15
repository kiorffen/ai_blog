#!/bin/bash

go build -o ai_blog cmd/server/main.go
mv ai_blog output/bin
