from mutagen import File as MutagenFile


def get_duration_seconds(file_path):
    try:
        audio = MutagenFile(file_path)
        if audio is not None and audio.info is not None:
            return int(audio.info.length)
    except Exception:
        pass
    return 0