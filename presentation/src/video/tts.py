"""Renders each slide's speaker notes to audio/NN.wav with Cartesia, skipping unchanged slides."""
import hashlib, json, os, re, sys
from pptx import Presentation
from cartesia import call

VOICE = "9287676d-f0cc-423f-ac03-3b3c7242f091"  # Allen - Modern Voice
MODEL, SPEED = "sonic-3.6", 0.75  # newest model; Allen bottoms out near 180 words per minute

# Spoken forms for code tokens, longest first.
SPOKEN = [
    ("__dylib_entry_Animal", "dylib entry Animal"), ("__dylib_entry_Trick", "dylib entry Trick"),
    ("create_animal", "create animal"), ("dlopen", "D L open"), ("dlsym", "D L sym"),
    ("dlclose", "D L close"), ("dyld", "D Y L D"), ("DYLB", "D Y L B"), ("ABI", "A B I"),
    ("NSClassFromString", "N S Class From String"), ("DyLib", "Dye Lib "), ("dylib", "dye lib"),
    ("Package.swift", "Package dot swift"), ("iOS", "eye O S"),
]

def spoken(text):
    for a, b in SPOKEN:
        text = text.replace(a, b)
    text = re.sub(r"(?<=\w)\.(?=[A-Za-z])", " dot ", text)       # MousePlugin.instance
    text = re.sub(r"(?<=\w)/(?=\w)", " slash ", text)
    text = re.sub(r"\b([a-z]+[A-Z]\w*|[A-Z][a-z]+[A-Z]\w*)\b",    # camelCase -> words
                  lambda m: re.sub(r"(?<=[a-z])(?=[A-Z])", " ", m.group(1)) if m.group(1) != "GitHub" else m.group(1), text)
    return re.sub(r"\s+", " ", text).strip()

deck, outdir = sys.argv[1], sys.argv[2]
os.makedirs(outdir, exist_ok=True)
for i, slide in enumerate(Presentation(deck).slides, 1):
    text = spoken(slide.notes_slide.notes_text_frame.text)
    key = f"{MODEL} {SPEED} {VOICE}\n{text}"
    wav, stamp = f"{outdir}/{i:02d}.wav", f"{outdir}/{i:02d}.txt"
    if os.path.exists(wav) and os.path.exists(stamp) and open(stamp).read() == key:
        continue
    audio = call("POST", "/tts/bytes", {
        "model_id": MODEL, "generation_config": {"speed": SPEED}, "transcript": text, "language": "en",
        "voice": {"mode": "id", "id": VOICE},
        "output_format": {"container": "wav", "encoding": "pcm_s16le", "sample_rate": 44100},
    })
    open(wav, "wb").write(audio)
    open(stamp, "w").write(key)
    print(f"slide {i}: {len(audio) // 1024} KB")
