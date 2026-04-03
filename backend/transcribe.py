"""OpenAI Whisper API transcription service"""
import os
import tempfile
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client
client = None

def get_client():
    global client
    if client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not set in environment")
        client = OpenAI(api_key=api_key)
    return client

def transcribe_audio(audio_data: bytes, mime_type: str = "audio/webm") -> str:
    """
    Transcribe audio data to text using OpenAI Whisper API.

    Args:
        audio_data: Raw audio bytes
        mime_type: Audio MIME type (used for file extension)

    Returns:
        Transcribed text
    """
    # Determine file extension from mime type
    ext_map = {
        "audio/webm": "webm",
        "audio/mp4": "m4a",
        "audio/mpeg": "mp3",
        "audio/wav": "wav",
        "audio/ogg": "ogg",
    }
    ext = ext_map.get(mime_type, "webm")

    # Write audio to temp file (OpenAI API needs a file)
    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as f:
        f.write(audio_data)
        temp_path = f.name

    try:
        client = get_client()
        with open(temp_path, "rb") as audio_file:
            result = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="ja",
            )
        return result.text.strip()
    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
