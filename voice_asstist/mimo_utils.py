import os
import json
import base64
import subprocess
import requests
from openai import OpenAI, APIError, AuthenticationError, RateLimitError
from config import *

# 初始化全局客户端（用于对话功能）
client = OpenAI(
    base_url=MIMO_BASE_URL,
    api_key=MIMO_API_KEY
)

# 获取ffmpeg路径（优先使用imageio-ffmpeg自带的）
try:
    import imageio_ffmpeg
    FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    FFMPEG_PATH = "ffmpeg"

def _tts_request(messages, model=DEFAULT_TTS_MODEL, audio_config=None):
    """TTS请求封装（使用requests库，避免OpenAI SDK连接问题）"""
    url = f"{MIMO_BASE_URL}/chat/completions"
    headers = {
        "Authorization": f"Bearer {MIMO_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": model,
        "messages": messages,
        "audio": audio_config or {"format": "wav", "voice": DEFAULT_TTS_VOICE}
    }
    response = requests.post(url, headers=headers, json=data, timeout=60)
    if response.status_code != 200:
        raise Exception(f"API错误: {response.status_code} - {response.text}")
    return response.json()

def convert_audio(input_path, output_format="wav"):
    """音频格式转换
    支持格式：m4a, mp3, wav, flac, ogg, aac等
    返回转换后的文件路径
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"文件不存在：{input_path}")

    base, ext = os.path.splitext(input_path)
    ext = ext.lower().lstrip(".")

    # 如果已经是目标格式，直接返回
    if ext == output_format:
        return input_path

    output_path = f"{base}.{output_format}"

    try:
        cmd = [FFMPEG_PATH, "-i", input_path, "-y", output_path]
        result = subprocess.run(cmd, capture_output=True, timeout=60)
        if result.returncode != 0:
            stderr = result.stderr.decode("utf-8", errors="ignore")
            raise Exception(f"ffmpeg转换失败：{stderr}")
        return output_path
    except FileNotFoundError as e:
        raise Exception(f"ffmpeg不可用({FFMPEG_PATH})：{e}")
    except Exception as e:
        raise Exception(f"转换出错：{e}")

# ==============================================
# 1. 基础对话功能（已修复流式输出空值问题）
# ==============================================
def single_chat(prompt, model=DEFAULT_MODEL, temperature=DEFAULT_TEMPERATURE, max_tokens=DEFAULT_MAX_TOKENS):
    """单轮对话"""
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=max_tokens
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"错误：{str(e)}"

def multi_chat_stream():
    """多轮流式对话（已修复list index out of range错误）"""
    print("\n=== 多轮流式对话模式（输入'退出'返回主菜单）===")
    messages = [
        {"role": "system", "content": "你是小米MIMO智能助手，回答要简洁准确，乐于助人。"}
    ]
    
    while True:
        user_input = input("\n你：")
        if user_input.lower() in ["退出", "exit", "quit"]:
            print("退出多轮对话")
            break
        
        messages.append({"role": "user", "content": user_input})
        
        try:
            response = client.chat.completions.create(
                model=DEFAULT_MODEL,
                messages=messages,
                stream=True,
                temperature=DEFAULT_TEMPERATURE,
                max_tokens=DEFAULT_MAX_TOKENS
            )
            
            print("MIMO：", end="", flush=True)
            full_response = ""
            for chunk in response:
                # 关键修复：添加空值检查，跳过空chunk
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta
                if delta and delta.content:
                    content = delta.content
                    print(content, end="", flush=True)
                    full_response += content
            print()
            
            messages.append({"role": "assistant", "content": full_response})
        except Exception as e:
            print(f"\n错误：{str(e)}")

# ==============================================
# 2. TTS语音合成功能（使用chat completions接口）
# ==============================================
def text_to_speech(text, voice=DEFAULT_TTS_VOICE, output_file="output.wav"):
    """文本转语音（使用内置音色）
    voice: 内置音色名，如 冰糖/茉莉/苏打/白桦/Mia/Chloe/Milo/Dean
    """
    try:
        messages = [
            {"role": "user", "content": ""},
            {"role": "assistant", "content": text}
        ]
        result = _tts_request(messages, audio_config={"format": "wav", "voice": voice})
        audio_bytes = base64.b64decode(result["choices"][0]["message"]["audio"]["data"])
        with open(output_file, "wb") as f:
            f.write(audio_bytes)
        return f"✅ 语音已保存为：{os.path.abspath(output_file)}"
    except Exception as e:
        return f"❌ 错误：{str(e)}"

def text_to_speech_with_style(text, style="", voice=DEFAULT_TTS_VOICE, output_file="output.wav"):
    """带风格控制的文本转语音
    style: 自然语言风格描述，如"用欢快的语气，语速稍快"
    voice: 内置音色名
    """
    try:
        messages = [
            {"role": "user", "content": style or ""},
            {"role": "assistant", "content": text}
        ]
        result = _tts_request(messages, audio_config={"format": "wav", "voice": voice})
        audio_bytes = base64.b64decode(result["choices"][0]["message"]["audio"]["data"])
        with open(output_file, "wb") as f:
            f.write(audio_bytes)
        return f"✅ 语音已保存为：{os.path.abspath(output_file)}"
    except Exception as e:
        return f"❌ 错误：{str(e)}"

# ==============================================
# 3. 语音克隆功能（音频通过base64传入）
# ==============================================
def clone_voice(audio_path, text, output_file="cloned_output.wav"):
    """使用音频样本克隆音色并生成语音
    audio_path: 音频文件路径（支持m4a/mp3/wav/flac等格式，m4a会自动转换）
    text: 要合成的文本
    """
    if not os.path.exists(audio_path):
        return f"❌ 文件不存在：{audio_path}"

    try:
        # 检查是否需要格式转换（m4a等格式需要转为mp3/wav）
        ext = os.path.splitext(audio_path)[1].lower().lstrip(".")
        if ext not in ("mp3", "wav"):
            print(f"  检测到{ext}格式，正在转换为wav...")
            audio_path = convert_audio(audio_path, "wav")
            ext = "wav"

        with open(audio_path, "rb") as f:
            voice_bytes = f.read()
        voice_base64 = base64.b64encode(voice_bytes).decode("utf-8")
        mime_type = "audio/mpeg" if ext == "mp3" else "audio/wav"

        messages = [
            {"role": "user", "content": ""},
            {"role": "assistant", "content": text}
        ]
        result = _tts_request(
            messages,
            model="mimo-v2.5-tts-voiceclone",
            audio_config={"format": "wav", "voice": f"data:{mime_type};base64,{voice_base64}"}
        )
        audio_bytes = base64.b64decode(result["choices"][0]["message"]["audio"]["data"])
        with open(output_file, "wb") as f:
            f.write(audio_bytes)
        return f"✅ 克隆语音已保存为：{os.path.abspath(output_file)}"
    except Exception as e:
        return f"❌ 错误：{str(e)}"

# ==============================================
# 4. 音色设计功能（通过文字描述生成音色）
# ==============================================
def design_voice(voice_prompt, text, output_file="designed_output.wav"):
    """通过文字描述设计音色并生成语音
    voice_prompt: 音色描述，如"温柔的年轻女性声音，语速适中"
    text: 要合成的文本
    """
    try:
        messages = [
            {"role": "user", "content": voice_prompt},
            {"role": "assistant", "content": text}
        ]
        result = _tts_request(messages, model="mimo-v2.5-tts-voicedesign", audio_config={"format": "wav"})
        audio_bytes = base64.b64decode(result["choices"][0]["message"]["audio"]["data"])
        with open(output_file, "wb") as f:
            f.write(audio_bytes)
        return f"✅ 音色设计语音已保存为：{os.path.abspath(output_file)}"
    except Exception as e:
        return f"❌ 错误：{str(e)}"

# ==============================================
# 5. 函数调用功能（已添加柳州天气数据）
# ==============================================
# 定义可用工具
def get_weather(city):
    """获取指定城市的当前天气"""
    # 已添加柳州天气数据
    weather_db = {
        "北京": "晴天，25℃，微风，空气质量优",
        "上海": "多云转晴，28℃，东南风3级",
        "广州": "小雨，30℃，南风2级，湿度80%",
        "深圳": "雷阵雨，29℃，西南风4级",
        "杭州": "晴，26℃，东北风2级",
        "柳州": "多云，27℃，南风2级，空气质量良，紫外线中等"
    }
    return weather_db.get(city, f"暂无{city}的天气数据")

def calculate(expression):
    """简单计算器"""
    try:
        # 安全计算，只允许基本运算
        allowed_chars = "0123456789+-*/(). "
        if not all(c in allowed_chars for c in expression):
            return "错误：只允许使用数字和+-*/()运算符"
        result = eval(expression)
        return f"计算结果：{expression} = {result}"
    except Exception as e:
        return f"计算错误：{str(e)}"

# 工具描述
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "获取中国主要城市的当前天气情况",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "城市名称，例如：北京、上海、柳州"
                    }
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
                    "expression": {
                        "type": "string",
                        "description": "数学表达式，例如：123+456、(10+20)*3"
                    }
                },
                "required": ["expression"]
            }
        }
    }
]

def function_call_demo():
    """函数调用演示"""
    print("\n=== 函数调用演示模式（输入'退出'返回主菜单）===")
    print("支持的功能：查询天气、数学计算")
    print("示例问题：")
    print("- 今天柳州的天气怎么样？")
    print("- 计算123乘以456等于多少")
    print("- 北京明天会下雨吗？如果不下雨，帮我算一下2的10次方")
    
    while True:
        user_input = input("\n你：")
        if user_input.lower() in ["退出", "exit", "quit"]:
            print("退出函数调用演示")
            break
        
        messages = [{"role": "user", "content": user_input}]
        
        try:
            # 第一次调用：让模型决定是否需要调用工具
            response = client.chat.completions.create(
                model=DEFAULT_MODEL,
                messages=messages,
                tools=tools,
                tool_choice="auto"
            )
            
            response_message = response.choices[0].message
            
            # 如果模型需要调用工具
            if response_message.tool_calls:
                print("\n🔧 模型正在调用工具...")
                messages.append(response_message)
                
                # 处理所有工具调用
                for tool_call in response_message.tool_calls:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)
                    
                    print(f"  → 调用工具：{function_name}，参数：{function_args}")
                    
                    # 执行工具函数
                    function_response = globals()[function_name](**function_args)
                    print(f"  → 工具返回：{function_response}")
                    
                    # 将工具结果返回给模型
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": function_name,
                        "content": function_response
                    })
                
                # 第二次调用：让模型根据工具结果生成最终回答
                print("\n📝 模型正在生成最终回答...")
                final_response = client.chat.completions.create(
                    model=DEFAULT_MODEL,
                    messages=messages
                )
                
                print(f"\nMIMO：{final_response.choices[0].message.content}")
            else:
                # 不需要调用工具，直接回答
                print(f"\nMIMO：{response_message.content}")
                
        except Exception as e:
            print(f"\n错误：{str(e)}")