from mimo_utils import *

def print_menu():
    """打印主菜单"""
    print("\n" + "="*50)
    print("        小米MIMO API 全功能练手工具")
    print("="*50)
    print("1. 单轮对话测试")
    print("2. 多轮流式对话（打字机效果）")
    print("3. TTS文本转语音（内置音色）")
    print("4. 语音克隆（上传音频克隆音色）")
    print("5. 音色设计（文字描述生成自定义声音）")
    print("6. 函数调用演示（天气查询+计算器）")
    print("0. 退出程序")
    print("="*50)

def main():
    print("欢迎使用小米MIMO API全功能练手项目！")
    print("请确保已在config.py中填写正确的API密钥")
    
    while True:
        print_menu()
        choice = input("请输入你的选择（0-6）：")
        
        if choice == "0":
            print("感谢使用，再见！")
            break
        
        elif choice == "1":
            print("\n=== 单轮对话测试 ===")
            prompt = input("请输入你的问题：")
            print("\nMIMO正在思考...")
            result = single_chat(prompt)
            print(f"\nMIMO：{result}")
            input("\n按回车键返回主菜单...")
        
        elif choice == "2":
            multi_chat_stream()
            input("\n按回车键返回主菜单...")
        
        elif choice == "3":
            print("\n=== TTS文本转语音（内置音色）===")
            print("可用音色：冰糖、茉莉、苏打、白桦、Mia、Chloe、Milo、Dean")
            text = input("请输入要转换的文本：")
            voice = input(f"请选择音色（默认：{DEFAULT_TTS_VOICE}）：") or DEFAULT_TTS_VOICE
            style = input("请输入风格描述（可选，如'用欢快的语气'，直接回车跳过）：") or ""
            output_file = input("请输入输出文件名（默认：output.wav）：") or "output.wav"

            print("\n正在生成语音...")
            if style:
                result = text_to_speech_with_style(text, style, voice, output_file)
            else:
                result = text_to_speech(text, voice, output_file)
            print(result)
            input("\n按回车键返回主菜单...")
        
        elif choice == "4":
            print("\n=== 语音克隆 ===")
            print("提示：请准备30秒-5分钟的清晰单人音频")
            print("支持格式：MP3、WAV、M4A、FLAC等（M4A会自动转换）")
            audio_path = input("请输入音频文件路径（例如：my_voice.m4a）：")
            text = input("请输入要合成的文本：")
            output_file = input("请输入输出文件名（默认：cloned_output.wav）：") or "cloned_output.wav"

            print("\n正在克隆音色并生成语音...")
            result = clone_voice(audio_path, text, output_file)
            print(result)
            input("\n按回车键返回主菜单...")
        
        elif choice == "5":
            print("\n=== 音色设计 ===")
            print("示例音色描述：")
            print("- 温柔的年轻女性声音，语速适中，语气亲切")
            print("- 低沉磁性的男性声音，语速稍慢，有感染力")
            print("- 活泼的少年音，语速稍快，开朗阳光")
            voice_prompt = input("请输入音色描述：")
            text = input("请输入要合成的文本：")
            output_file = input("请输入输出文件名（默认：designed_output.wav）：") or "designed_output.wav"

            print("\n正在设计音色并生成语音...")
            result = design_voice(voice_prompt, text, output_file)
            print(result)
            input("\n按回车键返回主菜单...")
        
        elif choice == "6":
            function_call_demo()
            input("\n按回车键返回主菜单...")
        
        else:
            print("无效的选择，请输入0-6之间的数字")
            input("\n按回车键返回主菜单...")

if __name__ == "__main__":
    main()