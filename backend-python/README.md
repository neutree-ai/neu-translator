# Neu Translator - Python Backend

Python后端实现，完全兼容原有的Next.js前端。

## 特性

- ✅ **完整的Agent循环实现** - 支持工具调用、Copilot请求/响应流程
- ✅ **消息管理** - 保持每一轮消息交互的完整性
- ✅ **会话管理** - 支持多个并发翻译会话
- ✅ **Memory系统** - 从用户反馈中学习偏好
- ✅ **工具系统** - Translate、Read、LS、Thinking
- ✅ **消息压缩** - 长对话历史的智能压缩
- ✅ **API兼容** - 与现有前端完全兼容

## 架构

```
backend-python/
├── core/                  # 核心逻辑
│   ├── agent.py          # AgentLoop实现
│   ├── context.py        # 消息上下文管理
│   ├── memory.py         # Memory系统
│   ├── llm.py            # LLM客户端配置
│   ├── types.py          # 类型定义
│   ├── tools/            # 工具实现
│   │   ├── translate_tool.py
│   │   ├── read_tool.py
│   │   ├── ls_tool.py
│   │   └── thinking_tool.py
│   └── prompts/          # Prompt模板
│       ├── system_workflow.py
│       ├── system_memory.py
│       └── system_compact.py
├── api/                   # FastAPI应用
│   ├── main.py           # 主应用入口
│   └── session_manager.py # 会话管理
├── requirements.txt       # Python依赖
├── .env.example          # 环境变量示例
└── README.md             # 本文件
```

## 消息交互流程

### 1. 基本流程

```
用户输入
    ↓
POST /api/next (sessionId, userInput)
    ↓
AgentLoop.next()
    ↓
[Agent循环]
    ├─→ 调用LLM生成响应和工具调用
    ├─→ 执行工具（Read/LS/Thinking直接返回结果）
    ├─→ Translate工具 → 返回copilotRequest
    └─→ 判断下一个actor（user/agent）
    ↓
返回响应（包含messages、copilotRequests、actor）
```

### 2. Copilot请求/响应循环

这是翻译工作流中最关键的部分：

```python
# 第一轮：Agent生成翻译请求
POST /api/next
{
  "sessionId": "xxx",
  "userInput": "翻译这个文件"
}

# 响应包含copilotRequest
Response:
{
  "sessionId": "xxx",
  "agentResponse": {
    "actor": "agent",  # 仍然是agent，等待用户审批
    "copilotRequests": [{
      "tool": "Translate",
      "src_string": "原文",
      "translate_string": "翻译草稿",
      "file_id": "file.md"
    }],
    "messages": [],
    "unprocessedToolCalls": [...]
  }
}

# 第二轮：用户审批翻译
POST /api/next
{
  "sessionId": "xxx",
  "copilotResponses": [{
    "tool": "Translate",
    "status": "approve",  # 或 "reject" / "refined"
    "translated_string": "最终翻译",
    "reason": "",
    "tool_call_id": "xxx"
  }]
}

# 响应包含工具结果，继续循环
Response:
{
  "sessionId": "xxx",
  "agentResponse": {
    "actor": "agent",  # 继续翻译下一段
    "copilotRequests": [],
    "messages": [{
      "role": "tool",
      "content": [...]
    }]
  }
}
```

### 3. 关键点

- **每一轮消息都被完整保存** - 通过Context类管理
- **工具调用追踪** - `getUnprocessedToolCalls()` 确保每个工具调用都被处理
- **Copilot状态管理** - copilotResponses与tool_call_id匹配
- **Actor决策** - 根据工具调用和消息内容决定下一个行动者

## 安装

### 1. 创建虚拟环境

```bash
cd backend-python
python -m venv venv

# 激活虚拟环境
# Linux/Mac:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 OPENROUTER_API_KEY
```

## 运行

### 开发模式

```bash
# 确保在backend-python目录下
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### 生产模式

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API端点

### POST /api/next

主要的agent循环端点。

**请求体:**
```json
{
  "sessionId": "optional-session-id",
  "userInput": "用户输入（可选）",
  "copilotResponses": []  // Copilot响应（可选）
}
```

**响应:**
```json
{
  "sessionId": "session-id",
  "agentResponse": {
    "actor": "user" | "agent",
    "messages": [],
    "unprocessedToolCalls": [],
    "copilotRequests": [],
    "finishReason": "stop" | "length" | ...
  }
}
```

### GET /api/sessions

列出所有会话。

**响应:**
```json
{
  "sessions": [
    {
      "id": "session-id",
      "messages": [],
      "copilotResponses": [],
      "created_at": "2024-01-01T00:00:00"
    }
  ]
}
```

### GET /api/sessions/{id}

获取特定会话数据。

**响应:**
```json
{
  "id": "session-id",
  "messages": [],
  "copilotResponses": [],
  "created_at": "2024-01-01T00:00:00"
}
```

## 与前端集成

Python后端完全兼容现有的Next.js前端。只需要：

1. 启动Python后端：`uvicorn api.main:app --reload --port 8000`
2. 修改前端的API配置，指向Python后端：
   ```typescript
   // 在前端配置文件中
   const API_BASE_URL = "http://localhost:8000";
   ```
3. 前端代码无需其他修改，所有API调用保持不变

## 技术栈

- **FastAPI** - 现代、高性能的Python Web框架
- **OpenAI Python SDK** - 用于调用OpenRouter API
- **Pydantic** - 数据验证和设置管理
- **Uvicorn** - ASGI服务器

## 开发

### 添加新工具

1. 在 `core/tools/` 下创建新的工具文件
2. 定义工具schema和executor函数
3. 在 `core/tools/__init__.py` 中注册工具

示例：
```python
# core/tools/my_tool.py
my_tool = {
    "type": "function",
    "function": {
        "name": "MyTool",
        "description": "工具描述",
        "parameters": {...}
    }
}

async def my_tool_executor(input_data, options, copilot_response):
    # 实现工具逻辑
    return {
        "type": "tool-result",
        "payload": {...}
    }
```

### 调试

启用详细日志：
```bash
# 在代码中
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 注意事项

1. **环境变量** - 确保配置了 `OPENROUTER_API_KEY`
2. **CORS** - 生产环境中需要配置正确的CORS origins
3. **会话持久化** - 当前会话存储在内存中，重启后会丢失。生产环境建议使用数据库
4. **错误处理** - 生产环境需要更完善的错误处理和日志记录

## 许可证

与主项目保持一致。
