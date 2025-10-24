from typing import Literal
import re

Decision = Literal["approved", "blocked", "needs_review"]

# Very basic word filters (placeholders). We'll replace with a multilingual pipeline later.
BANNED_WORDS = {
    "hate": "hate speech",
    "kill": "violence",
    "suicide": "self-harm",
}

PII_PATTERNS = [
    re.compile(r"\b\d{10}\b"),  # phone-like
    re.compile(r"\b\d{12}\b"),  # aadhaar-like (placeholder)
]


def moderate_text(text: str) -> tuple[Decision, str | None]:
    t = text.lower()

    # PII check
    for pat in PII_PATTERNS:
        if pat.search(t):
            return "blocked", "contains_pii"

    # banned words
    for word, reason in BANNED_WORDS.items():
        if word in t:
            return "blocked", f"{reason}"

    # default approval for MVP; we can switch to needs_review for long/edge cases
    return "approved", None
