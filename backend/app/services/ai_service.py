import os
import json
import joblib
import base64
from flask import current_app

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None

class AIService:
    _instance = None
    
    def __init__(self):
        self.price_model = None
        self.embeddings = None
        self.gemini_model = None
        self._init_gemini()
        
    def _init_gemini(self):
        if not GEMINI_AVAILABLE:
            print("Warning: google-generativeai not installed")
            return
        api_key = os.environ.get('GEMINI_API_KEY')
        if api_key and len(api_key) > 10:
            try:
                genai.configure(api_key=api_key)
                # Try gemini-1.5-flash first, fallback to gemini-pro
                model_name = os.environ.get('GEMINI_TEXT_MODEL', 'gemini-1.5-flash')
                self.gemini_model = genai.GenerativeModel(model_name)
                # Test the model with a simple request
                print(f"Gemini AI initialized with model: {model_name}")
            except Exception as e:
                print(f"Failed to initialize Gemini: {e}")
                self.gemini_model = None
        else:
            print("Warning: GEMINI_API_KEY not set or invalid")
        
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = AIService()
        return cls._instance

    def load_models(self):
        # Lazy load models
        if self.price_model:
            return

        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        model_path = os.path.join(base_dir, 'models', 'fair_price_model.joblib')
        
        if os.path.exists(model_path):
            try:
                self.price_model = joblib.load(model_path)
                print("Loaded price model")
            except Exception as e:
                print(f"Failed to load price model: {e}")

    def estimate_price(self, make, model, year, specs):
        self.load_models()
        return 50000  # Mock return for structure demonstration

    def chat(self, message, history, image_base64=None):
        if not self.gemini_model:
            # Re-attempt initialization in case env was loaded after service init
            self._init_gemini()
            
        if not self.gemini_model:
            return "I am the IntelliWheels AI Assistant. The AI service is currently unavailable. Please try again later."

        try:
            # Build conversation context
            system_prompt = """You are IntelliWheels AI Assistant, an expert automotive consultant for a car marketplace in the Middle East (primarily Jordan/GCC region). 
You help users:
- Find and compare cars
- Estimate fair market prices
- Create car listings
- Answer automotive questions
- Analyze car images

Be helpful, concise, and knowledgeable about cars. Prices are typically in JOD (Jordanian Dinar) or AED (UAE Dirham)."""

            # Build message content
            contents = []
            
            # Add history context
            if history:
                history_text = "\n".join([f"{'User' if h.get('role') == 'user' else 'Assistant'}: {h.get('text', '')}" for h in history[-5:]])
                contents.append(f"Previous conversation:\n{history_text}\n\n")
            
            # Add current message
            contents.append(f"User: {message}")
            
            # Handle image if provided
            if image_base64:
                try:
                    # Remove data URL prefix if present
                    if ',' in image_base64:
                        image_base64 = image_base64.split(',')[1]
                    
                    image_data = base64.b64decode(image_base64)
                    image_part = {
                        'mime_type': 'image/jpeg',
                        'data': image_data
                    }
                    
                    response = self.gemini_model.generate_content([
                        system_prompt,
                        "\n".join(contents),
                        "Please analyze this car image and provide details about the vehicle:",
                        image_part
                    ])
                except Exception as e:
                    print(f"Image processing error: {e}")
                    response = self.gemini_model.generate_content([
                        system_prompt,
                        "\n".join(contents)
                    ])
            else:
                response = self.gemini_model.generate_content([
                    system_prompt,
                    "\n".join(contents)
                ])
            
            return response.text
            
        except Exception as e:
            error_msg = str(e)
            print(f"Gemini API error: {error_msg}")
            # Provide more specific error messages
            if 'API_KEY' in error_msg.upper() or 'authentication' in error_msg.lower():
                return "AI service configuration error. Please contact support."
            elif 'quota' in error_msg.lower() or 'limit' in error_msg.lower():
                return "AI service is temporarily unavailable due to high demand. Please try again later."
            elif 'blocked' in error_msg.lower() or 'safety' in error_msg.lower():
                return "I cannot process that request. Please rephrase your question."
            return "I apologize, but I encountered an issue processing your request. Please try again."

    def semantic_search(self, query, limit):
        # Mock implementation
        return [
            {
                "car": {
                    "id": 101,
                    "make": "Toyota",
                    "model": "Camry",
                    "year": 2023,
                    "price": 85000,
                    "currency": "AED",
                    "image": None,
                    "description": "A great car matching your search for " + query
                },
                "similarity": 0.95
            },
            {
                "car": {
                    "id": 102,
                    "make": "Honda",
                    "model": "Accord",
                    "year": 2022,
                    "price": 78000,
                    "currency": "AED",
                    "image": None,
                    "description": "Another option for " + query
                },
                "similarity": 0.92
            }
        ]

    def analyze_image(self, image_base64):
        if not self.gemini_model:
            self._init_gemini()
            
        if not self.gemini_model:
            return {
                "make": "Unknown",
                "model": "Unknown",
                "year": 2023,
                "bodyStyle": "Unknown",
                "estimatedPrice": 0,
                "conditionDescription": "AI service unavailable"
            }

        try:
            # Remove data URL prefix if present
            if ',' in image_base64:
                image_base64 = image_base64.split(',')[1]
            
            image_data = base64.b64decode(image_base64)
            image_part = {
                'mime_type': 'image/jpeg',
                'data': image_data
            }
            
            prompt = """Analyze this car image and provide the following information in JSON format:
{
    "make": "manufacturer name",
    "model": "model name",
    "year": estimated year as number,
    "bodyStyle": "Sedan/SUV/Coupe/Hatchback/Truck/Van/Convertible",
    "estimatedPrice": estimated price in AED as number,
    "conditionDescription": "brief description of visible condition"
}

Only respond with the JSON, no other text."""

            response = self.gemini_model.generate_content([prompt, image_part])
            
            # Parse JSON from response
            response_text = response.text.strip()
            # Remove markdown code blocks if present
            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]
            response_text = response_text.strip()
            
            return json.loads(response_text)
            
        except Exception as e:
            print(f"Image analysis error: {e}")
            return {
                "make": "Toyota",
                "model": "Camry",
                "year": 2022,
                "bodyStyle": "Sedan",
                "estimatedPrice": 82000,
                "conditionDescription": "Unable to analyze image. Default values provided."
            }

    def listing_assistant(self, query, history):
        if not self.gemini_model:
            self._init_gemini()
            
        if not self.gemini_model:
            return {
                "success": True,
                "response": "I can help you draft a listing, but the AI service is currently unavailable.",
                "action_type": None,
                "listing_data": None
            }

        try:
            system_prompt = """You are a car listing assistant for IntelliWheels marketplace. Help users create car listings.
When you have enough information to create a listing, respond with JSON in this format:
{
    "response": "your helpful message",
    "action_type": "draft",
    "listing_data": {
        "make": "...",
        "model": "...",
        "year": number,
        "price": number,
        "description": "..."
    }
}

If you need more information, just respond normally without the listing_data."""

            history_text = ""
            if history:
                history_text = "\n".join([f"{'User' if h.get('role') == 'user' else 'Assistant'}: {h.get('text', '')}" for h in history[-5:]])
            
            response = self.gemini_model.generate_content([
                system_prompt,
                f"Conversation history:\n{history_text}\n\nUser: {query}"
            ])
            
            response_text = response.text.strip()
            
            # Try to parse as JSON
            try:
                if response_text.startswith('```'):
                    response_text = response_text.split('```')[1]
                    if response_text.startswith('json'):
                        response_text = response_text[4:]
                response_text = response_text.strip()
                data = json.loads(response_text)
                return {
                    "success": True,
                    "response": data.get("response", response_text),
                    "action_type": data.get("action_type"),
                    "listing_data": data.get("listing_data")
                }
            except json.JSONDecodeError:
                return {
                    "success": True,
                    "response": response.text,
                    "action_type": None,
                    "listing_data": None
                }
                
        except Exception as e:
            print(f"Listing assistant error: {e}")
            return {
                "success": True,
                "response": "I encountered an issue. Please try again.",
                "action_type": None,
                "listing_data": None
            }

ai_service = AIService.get_instance()
