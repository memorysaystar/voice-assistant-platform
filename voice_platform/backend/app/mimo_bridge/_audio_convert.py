import glob
import os
import shutil
import subprocess
import logging

logger = logging.getLogger(__name__)


def _find_ffmpeg() -> str:
    """查找 ffmpeg 可执行文件路径 / Find ffmpeg executable path."""
    # 方法1：通过 imageio_ffmpeg 获取 / Try imageio_ffmpeg
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass

    # 方法2：直接在 imageio_ffmpeg 包目录查找二进制文件（不触发完整导入）
    # Try finding binary directly in imageio_ffmpeg package directory (without full import)
    try:
        import importlib.util
        spec = importlib.util.find_spec("imageio_ffmpeg")
        if spec and spec.origin:
            pkg_dir = os.path.dirname(spec.origin)
            binaries = glob.glob(os.path.join(pkg_dir, "binaries", "ffmpeg*"))
            binaries = [b for b in binaries if b.endswith(".exe") or not b.endswith(".md")]
            if binaries:
                logger.info("直接找到 ffmpeg 二进制: %s / Found ffmpeg binary directly: %s", binaries[0], binaries[0])
                return binaries[0]
    except Exception:
        pass

    # 方法3：在系统 PATH 中查找 / Search system PATH
    found = shutil.which("ffmpeg")
    if found:
        logger.info("在 PATH 中找到 ffmpeg: %s / Found ffmpeg in PATH: %s", found, found)
        return found

    logger.warning("未找到 ffmpeg，将使用默认值 'ffmpeg' / ffmpeg not found, using default 'ffmpeg'")
    return "ffmpeg"


FFMPEG_PATH = _find_ffmpeg()
logger.info("FFMPEG_PATH: %s / FFMPEG_PATH: %s", FFMPEG_PATH, FFMPEG_PATH)


def convert_audio(input_path: str, output_format: str = "wav") -> str:
    """音频格式转换"""
    """Convert audio format."""
    base, ext = os.path.splitext(input_path)
    ext = ext.lower().lstrip(".")
    if ext == output_format:
        return input_path

    output_path = f"{base}.{output_format}"
    cmd = [FFMPEG_PATH, "-i", input_path, "-y", output_path]
    result = subprocess.run(cmd, capture_output=True, timeout=60)
    if result.returncode != 0:
        stderr = result.stderr.decode("utf-8", errors="ignore")
        raise Exception(f"ffmpeg转换失败 / ffmpeg conversion failed: {stderr}")
    logger.info("音频已转换: %s -> %s / Audio converted: %s -> %s", input_path, output_path, input_path, output_path)
    return output_path
