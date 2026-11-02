"""Writes narration.md from the deck's slide titles and speaker notes."""
import sys
from pptx import Presentation
from pptx.enum.shapes import PP_PLACEHOLDER

deck, out = sys.argv[1], sys.argv[2]
md = ["# Dynasty talk: narration", "",
      "About 17 minutes of narration (roughly 2,400 words), plus time for questions. The same text is in each slide's speaker notes."]
for i, slide in enumerate(Presentation(deck).slides, 1):
    title = next((sh.text_frame.text.replace("\n", " ") for sh in slide.placeholders
                  if sh.placeholder_format.type == PP_PLACEHOLDER.TITLE), "")
    notes = slide.notes_slide.notes_text_frame.text if slide.has_notes_slide else ""
    md += ["", f"## {i}. {title}", "", notes.strip()]
open(out, "w").write("\n".join(md) + "\n")
