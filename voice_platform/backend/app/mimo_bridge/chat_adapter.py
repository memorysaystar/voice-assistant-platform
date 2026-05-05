from __future__ import annotations
import asyncio
import json
import logging
from typing import AsyncGenerator

from app.config import settings
from app.mimo_bridge.client import get_mimo_client

logger = logging.getLogger(__name__)

# 工具定义（来自 mimo_utils.py）
# Tool definitions (from mimo_utils.py)
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "获取中国主要城市的当前天气情况",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "城市名称，例如：北京、上海、柳州"}
                },
                "required": ["city"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate",
            "description": "执行简单的数学计算，支持加减乘除和括号",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {"type": "string", "description": "数学表达式，例如：123+456、(10+20)*3"}
                },
                "required": ["expression"]
            }
        }
    }
]


def _get_weather(city: str) -> str:
    """获取天气信息"""
    """Get weather info."""
    weather_db = {
        "北京": "晴天，25℃，微风，空气质量优",
        "上海": "多云转晴，28℃，东南风3级",
        "广州": "小雨，30℃，南风2级，湿度80%",
        "深圳": "雷阵雨，29℃，西南风4级",
        "杭州": "晴，26℃，东北风2级",
        "柳州": "多云，27℃，南风2级，空气质量良，紫外线中等"
    }
    return weather_db.get(city, f"暂无{city}的天气数据")


def _calculate(expression: str) -> str:
    """数学计算器"""
    """Math calculator."""
    allowed_chars = "0123456789+-*/(). "
    if not all(c in allowed_chars for c in expression):
        return "错误：只允许使用数字和+-*/()运算符"
    try:
        result = eval(expression)
        return f"计算结果：{expression} = {result}"
    except Exception as e:
        return f"计算错误：{str(e)}"


FUNCTION_MAP = {
    "get_weather": _get_weather,
    "calculate": _calculate,
}


async def single_chat(
    prompt: str,
    messages: list[dict] | None = None,
    model: str | None = None,
    temperature: float | None = None,
    max_tokens: int | None = None,
    user_api_key: str | None = None,
) -> str:
    """单轮对话（异步）"""
    """Single-turn chat (async)."""
    client = get_mimo_client(user_api_key)
    if messages is None:
        messages = [{"role": "user", "content": prompt}]

    logger.info("单轮对话: 模型=%s, 消息数=%d / single_chat: model=%s, msg_count=%d",
                model or settings.mimo_default_model, len(messages),
                model or settings.mimo_default_model, len(messages))

    def _call():
        return client.chat.completions.create(
            model=model or settings.mimo_default_model,
            messages=messages,
            temperature=temperature or settings.mimo_temperature,
            max_tokens=max_tokens or settings.mimo_max_tokens,
        )

    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(None, _call)
    content = response.choices[0].message.content or ""
    logger.info("单轮对话完成: %d字符 / single_chat completed: %d chars", len(content), len(content))
    return content


async def stream_chat(
    messages: list[dict],
    model: str | None = None,
    temperature: float | None = None,
    max_tokens: int | None = None,
    user_api_key: str | None = None,
) -> AsyncGenerator[str, None]:
    """多轮流式对话（异步生成器）"""
    """Multi-turn streaming chat (async generator)."""
    client = get_mimo_client(user_api_key)
    logger.info("流式对话: 模型=%s, 消息数=%d / stream_chat: model=%s, msg_count=%d",
                model or settings.mimo_default_model, len(messages),
                model or settings.mimo_default_model, len(messages))

    def _call():
        return client.chat.completions.create(
            model=model or settings.mimo_default_model,
            messages=messages,
            stream=True,
            temperature=temperature or settings.mimo_temperature,
            max_tokens=max_tokens or settings.mimo_max_tokens,
        )

    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(None, _call)

    full_response = ""
    for chunk in response:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta
        if delta and delta.content:
            content = delta.content
            full_response += content
            yield content

    logger.info("流式对话完成: %d字符 / stream_chat completed: %d chars", len(full_response), len(full_response))


async def chat_with_functions(
    messages: list[dict],
    model: str | None = None,
    user_api_key: str | None = None,
) -> dict:
    """带函数调用的对话"""
    """Chat with function calling support."""
    client = get_mimo_client(user_api_key)
    logger.info("函数调用对话: 模型=%s, 消息数=%d / chat_with_functions: model=%s, msg_count=%d",
                model or settings.mimo_default_model, len(messages),
                model or settings.mimo_default_model, len(messages))

    def _first_call():
        return client.chat.completions.create(
            model=model or settings.mimo_default_model,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
        )

    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(None, _first_call)
    response_message = response.choices[0].message
    tool_calls_made = []

    if response_message.tool_calls:
        messages.append(response_message)

        for tool_call in response_message.tool_calls:
            func_name = tool_call.function.name
            func_args = json.loads(tool_call.function.arguments)

            func = FUNCTION_MAP.get(func_name)
            result = func(**func_args) if func else f"未知函数: {func_name}"

            tool_calls_made.append({"name": func_name, "args": func_args, "result": result})
            logger.info("工具调用: %s(%s) -> %s / Tool called: %s(%s) -> %s", func_name, func_args, result[:100], func_name, func_args, result[:100])

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": func_name,
                "content": result,
            })

        def _second_call():
            return client.chat.completions.create(
                model=model or settings.mimo_default_model,
                messages=messages,
            )

        final = await loop.run_in_executor(None, _second_call)
        return {
            "content": final.choices[0].message.content or "",
            "tool_calls_made": tool_calls_made,
        }
    else:
        return {
            "content": response_message.content or "",
            "tool_calls_made": [],
        }
