# Generates the "Sanket" guided-tour narration as MP3 files using
# Microsoft's free neural TTS (edge-tts), voice: en-IN-PrabhatNeural.
#
# Usage:  python generate_voice.py
# Output: audio/stepNN_MM.mp3  (one file per sentence, matching sanketh-tour.js)
#
# IMPORTANT: The texts below must stay identical to STEPS in sanketh-tour.js —
# both files split sentences with the same regex to derive matching filenames.

import asyncio
import os
import re

import edge_tts

VOICE = "en-IN-PrabhatNeural"
RATE = "+3%"

STEPS = [
    "Namaste, and welcome! I'm Sanket, your guide. Sanketh means 'the signal' in Sanskrit — and that's exactly what we sell: the signal before demand moves. Give me two minutes, and I'll walk you through the product, the market, and the returns — all in rupees.",
    "First, the problem. Indian businesses lose nearly one point seven five lakh crore rupees every year to stockouts — customers walk away when shelves are empty. Another thirty percent of working capital sits frozen in unsold inventory. Why? Because most companies still plan stock with spreadsheets and gut feeling.",
    "Our answer is three words: Sense. Predict. Act. Sanketh connects to a company's sales systems, reads live market signals — search trends, social buzz, even weather — runs twelve AI forecasting models, and tells the operations team exactly what to stock, five to fourteen days before demand shifts.",
    "Here is the product in action — this dashboard below is a live preview. For fashion brands, Sanketh reads social trends to predict which styles will sell, and cuts end-of-season markdown losses by over forty percent.",
    "Now watch — one click, and the same engine serves pharmaceuticals. Batch tracking, cold-chain monitoring, and audit-ready compliance built to U S FDA standards. This is a regulatory moat that competitors cannot easily copy. Five industries. One platform.",
    "The market. Globally, this is a one hundred and forty lakh crore rupee category. In India alone, supply-chain software is worth eight and a half thousand crore rupees — and we are targeting four hundred and twenty five crores of it within five years.",
    "Our business model is classic SaaS. Subscriptions start at about fifty thousand rupees a month, and scale to enterprise contracts above forty lakhs a year — with eighty five percent gross margins, and a target of six and a half rupees returned for every one rupee spent on sales.",
    "And here is the pitch that closes customers. Watch the numbers — for a typical twenty five crore revenue business, Sanketh saves around eighty four lakh rupees a year. That is a five point seven times return on investment, with payback in just over two months.",
    "One more thing — this is not a slide deck. The platform is already built and live today. The investment goes into go-to-market: ten paying pilots this year, and a twelve crore rupee A R R target by twenty twenty seven.",
    "That's Sanketh — we read the signal before demand moves. Try the live product, or request our investor deck right here. Thank you for listening — I hope you join us on this journey!",
]


def sentences(text):
    # Must mirror splitSentences() in sanketh-tour.js
    return re.findall(r"[^.!?]+[.!?]+", text) or [text]


async def main():
    os.makedirs("audio", exist_ok=True)
    total = 0
    for i, text in enumerate(STEPS, 1):
        for j, sentence in enumerate(sentences(text), 1):
            path = f"audio/step{i:02d}_{j:02d}.mp3"
            await edge_tts.Communicate(sentence.strip(), VOICE, rate=RATE).save(path)
            size = os.path.getsize(path)
            print(f"{path}  {size/1024:.0f} KB")
            total += 1
    print(f"\nDone — {total} clips generated with {VOICE}.")


if __name__ == "__main__":
    asyncio.run(main())
