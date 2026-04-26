import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]

for model in models:
    try:
        print(f"Testing {model}...")
        response = client.models.generate_content(
            model=model,
            contents="Say hello"
        )
        print(f"  Success: {response.text}")
    except Exception as e:
        print(f"  Failed {model}: {e}")
