# Edge-TTS Web 快速开始指南

## 极简步骤（3分钟上手）

### 1. 安装必备软件
```bash
# 安装 Python 包管理器 pip（如未安装）
python -m ensurepip --upgrade

# 安装 edge-tts
pip install edge-tts

# 安装 Node.js 依赖
cd "D:\English"
npm install
```

### 2. 启动服务
```bash
cd "D:\English"
npm start
```
服务地址：**http://localhost:3001**

### 3. 使用网页界面
1. 打开浏览器访问 **http://localhost:3001**
2. **点击**或**拖拽**文本文件到上传区域
3. 点击 **"Convert to Speech"** 按钮
4. 等待转换完成，使用播放器收听或下载音频

## 命令行快速使用

### 使用 edge.bat 批处理文件
```bash
# 进入项目目录
cd "D:\English"

# 转换单个文件
edge.bat wave_vejle.txt

# 转换当前目录所有 .txt 文件
for %f in (*.txt) do edge.bat "%f"
```

### 创建桌面快捷方式（Windows）
1. 右键桌面 → 新建 → 快捷方式
2. 位置输入：`cmd /c "cd /d D:\English && npm start"`
3. 名称：`Edge-TTS Web`
4. 双击运行快捷方式

## 常见任务速查

### 任务1：转换单个文件
```
网页方式：上传 → 选择语音 → 转换 → 播放/下载
命令行：edge.bat 文件名.txt
```

### 任务2：批量转换
```
创建批处理文件：
for %f in (*.txt) do edge.bat "%f"
```

### 任务3：更换语音
1. 网页界面点击语音卡片切换
2. 默认：en-US-MichelleNeural
3. 可选：en-US-GuyNeural, en-GB-SoniaNeural

### 任务4：修改端口
编辑 `server.js` 第8行：
```javascript
const port = 3002; // 改为其他端口
```

## 故障快速排查

### 问题1：服务无法启动
```
检查：node --version
解决：安装 Node.js v14+
```

### 问题2：edge-tts 找不到
```
检查：edge-tts --version
解决：pip install edge-tts
```

### 问题3：文件上传失败
```
原因：文件超过10MB或不支持格式
解决：转换为.txt格式，压缩文件
```

### 问题4：端口被占用
```
解决：修改 server.js 端口号
      重启服务
```

## 文件支持格式

| 格式 | 支持程度 | 说明 |
|------|---------|------|
| .txt | ✅ 完全支持 | 纯文本文件，推荐使用 |
| .doc | ⚠️ 有限支持 | Microsoft Word 97-2003 |
| .docx | ✅ 完全支持 | Microsoft Word 2007+ |
| .pdf | ⚠️ 有限支持 | 简单文本PDF，可能格式丢失 |

**推荐使用 .txt 格式获得最佳效果**

## 音频输出说明

- **格式**：WAV（无损音频）
- **质量**：edge-tts 默认高质量
- **文件名**：与文本文件同名（扩展名改为.wav）
- **保存位置**：`outputs\` 目录

## 快捷键参考

### 网页界面
- **点击上传区域**：打开文件选择
- **拖拽文件**：直接上传
- **空格键**：播放/暂停音频
- **ESC键**：停止播放

### 命令行
- **Ctrl+C**：停止服务器
- **Ctrl+Z**：暂停批处理

## 一键脚本

### 启动脚本（start.bat）
```batch
@echo off
title Edge-TTS Web 服务
echo 正在启动 Edge-TTS Web 服务...
cd /d "D:\English"
npm start
pause
```

### 清理脚本（cleanup.bat）
```batch
@echo off
echo 清理临时文件...
cd /d "D:\English"
if exist uploads\*.* del uploads\*.* /q
if exist outputs\*.* del outputs\*.* /q
echo 清理完成！
pause
```

## 可用工具

项目包含以下实用工具，可直接使用：

| 工具文件 | 功能说明 | 使用方法 |
|----------|----------|----------|
| **启动服务.bat** | 一键启动服务，自动检查环境 | 双击运行 |
| **测试安装.bat** | 诊断安装问题，验证系统配置 | 双击运行 |
| **清理文件.bat** | 安全清理临时文件和音频文件 | 双击运行，需要确认 |
| **edge.bat** | 命令行文本转语音工具 | `edge.bat 文件名.txt` |
| **test.txt** | 测试用示例文本文件 | 用于功能测试 |

## 下一步

- 查看详细文档：[使用说明.md](./使用说明.md)
- 查看英文文档：[README.md](./README.md)
- 测试示例文件：`test.txt` 或 `wave_vejle.txt`
- 探索高级功能

---

**提示**：首次使用建议用示例文件 `test.txt` 测试

**更新时间**：2026年3月7日
**版本**：v1.0