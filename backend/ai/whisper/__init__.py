import os
import subprocess
import tempfile
from groq import Groq
from flask import current_app

MAX_GROQ_BYTES = 25 * 1024 * 1024  # Groq's free-tier limit


def _compress_audio(input_path):
    """Downsample to mono 16kHz opus to shrink file size for speech transcription."""
    fd, output_path = tempfile.mkstemp(suffix=".ogg")
    os.close(fd)

    subprocess.run(
        [
            "ffmpeg", "-y",
            "-i", input_path,
            "-ac", "1",          # mono
            "-ar", "16000",      # 16kHz sample rate
            "-c:a", "libopus",
            "-b:a", "24k",       # low bitrate, fine for speech
            output_path,
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return output_path


def transcribe_audio(file_path):
    client = Groq(api_key=current_app.config["GROQ_API_KEY"])

    send_path = file_path
    temp_path = None

    if os.path.getsize(file_path) > MAX_GROQ_BYTES:
        temp_path = _compress_audio(file_path)
        send_path = temp_path

        if os.path.getsize(send_path) > MAX_GROQ_BYTES:
            os.remove(temp_path)
            raise ValueError(
                "Audio file is too large to transcribe even after compression. "
                "Please upload a shorter recording."
            )

    try:
        with open(send_path, "rb") as audio_file:
            result = client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=audio_file,
            )
        return result.text
    finally:
        if temp_path:
            os.remove(temp_path)