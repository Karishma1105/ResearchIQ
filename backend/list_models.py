import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# Initialize the client
client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY"), 
    http_options=types.HttpOptions(api_version="v1")
)

print("--- AVAILABLE MODELS FOR GENERATE_CONTENT ---")
# List all models and filter for ones that can generate content
for model in client.models.list():
    if model.supported_actions and "generateContent" in model.supported_actions:
        print(f"✅ {model.name}")