import asyncio, os, base64, io
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
from emergentintegrations.llm.chat import LlmChat, UserMessage
from PIL import Image

OUT = "/app/frontend/public/images"
os.makedirs(OUT, exist_ok=True)
API_KEY = os.getenv("EMERGENT_LLM_KEY")

STYLE = "soft diffused studio daylight, seamless warm light-grey background, muted neutral tones, high-end minimalist fashion catalog aesthetic inspired by Zara campaigns, photorealistic, sharp fabric detail"

JOBS = [
    ("hero", f"Cinematic high-fashion editorial photograph, full-body female model in an oversized beige trench coat and black boots, confident mid-stride pose, generous negative space on the left side, {STYLE}, wide landscape composition"),
    ("cat-women", f"Editorial fashion photograph, female model in a black tailored double-breasted blazer and ivory trousers, elegant standing pose, {STYLE}, vertical portrait composition"),
    ("cat-men", f"Editorial fashion photograph, male model in a beige single-breasted overcoat over a white tee, relaxed confident pose, {STYLE}, vertical portrait composition"),
    ("editorial", f"Wide editorial fashion scene, minimal atelier with a rack of neutral-toned garments, female model in a cream outfit adjusting a sleeve, soft window light, {STYLE}, wide landscape composition"),
    ("p-w1", f"Premium e-commerce fashion photograph, female model wearing an oversized camel wool coat, three-quarter standing pose, {STYLE}, vertical portrait composition"),
    ("p-w2", f"Premium e-commerce fashion photograph, female model wearing an ivory silk slip midi dress, elegant standing pose, {STYLE}, vertical portrait composition"),
    ("p-w3", f"Premium e-commerce fashion photograph, female model wearing a black double-breasted tailored blazer with matching trousers, {STYLE}, vertical portrait composition"),
    ("p-w4", f"Premium e-commerce fashion photograph, female model wearing a cream chunky cable-knit sweater with ecru jeans, {STYLE}, vertical portrait composition"),
    ("p-w5", f"Premium e-commerce fashion photograph, female model wearing charcoal wide-leg pleated trousers with a tucked white shirt, {STYLE}, vertical portrait composition"),
    ("p-w6", f"Premium e-commerce fashion photograph, female model wearing a crisp white oversized cotton poplin shirt, {STYLE}, vertical portrait composition"),
    ("p-w7", f"Premium e-commerce fashion photograph, female model wearing a black pleated midi skirt with a tucked white tee, {STYLE}, vertical portrait composition"),
    ("p-w8", f"Premium e-commerce fashion photograph, female model wearing a beige ribbed cashmere cardigan, arms softly crossed, {STYLE}, vertical portrait composition"),
    ("p-m1", f"Premium e-commerce fashion photograph, male model wearing a beige single-breasted wool overcoat over a white tee, {STYLE}, vertical portrait composition"),
    ("p-m2", f"Premium e-commerce fashion photograph, male model wearing a white relaxed-fit linen shirt with sleeves rolled, {STYLE}, vertical portrait composition"),
    ("p-m3", f"Premium e-commerce fashion photograph, male model wearing grey tailored wool trousers with a crisp white shirt, {STYLE}, vertical portrait composition"),
    ("p-m4", f"Premium e-commerce fashion photograph, male model wearing a black leather biker jacket over a plain white tee, {STYLE}, vertical portrait composition"),
    ("p-m5", f"Premium e-commerce fashion photograph, male model wearing a navy merino wool crewneck sweater, {STYLE}, vertical portrait composition"),
    ("p-m6", f"Premium e-commerce fashion photograph, male model wearing a washed indigo denim jacket, {STYLE}, vertical portrait composition"),
    ("p-m7", f"Premium e-commerce fashion photograph, male model wearing stone pleated chino trousers with a tucked white tee, {STYLE}, vertical portrait composition"),
    ("p-m8", f"Premium product still-life photograph, a pair of minimalist white leather sneakers on a light-grey stone plinth, {STYLE}, vertical portrait composition"),
]

async def gen(name, prompt, sem):
    async with sem:
        for attempt in range(3):
            try:
                chat = LlmChat(api_key=API_KEY, session_id=f"img-{name}-{attempt}", system_message="You generate premium fashion photography.")
                chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
                text, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
                if images:
                    raw = base64.b64decode(images[0]["data"])
                    img = Image.open(io.BytesIO(raw)).convert("RGB")
                    img.thumbnail((1400, 1400))
                    img.save(f"{OUT}/{name}.jpg", quality=82)
                    print(f"OK {name}", flush=True)
                    return
            except Exception as e:
                print(f"RETRY {name} a{attempt}: {type(e).__name__} {str(e)[:100]}", flush=True)
                await asyncio.sleep(3)
        print(f"FAIL {name}", flush=True)

async def main():
    sem = asyncio.Semaphore(4)
    await asyncio.gather(*[gen(n, p, sem) for n, p in JOBS])
    print("DONE", flush=True)

asyncio.run(main())
