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
    
    # Model names for FREE tier - gemini-2.5-flash is the latest free model
    GEMINI_MODELS = [
        'gemini-2.5-flash',               # Latest free tier model (2025)
        'gemini-2.5-pro',                 # Pro version
        'gemini-2.0-flash-lite',          # Lite version
        'gemini-2.0-flash',               # Previous free tier
        'models/gemini-2.5-flash',        # With prefix
        'models/gemini-2.0-flash',        # With prefix
    ]
    
    def __init__(self):
        self.price_model = None
        self.embeddings = None
        self.gemini_model = None
        self.active_model_name = None
        self._init_error = None
        self._init_gemini()
        
    def _init_gemini(self):
        if not GEMINI_AVAILABLE:
            print("Warning: google-generativeai not installed")
            self._init_error = "google-generativeai package not installed"
            return
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key or len(api_key) < 10:
            print("Warning: GEMINI_API_KEY not set or invalid")
            self._init_error = "GEMINI_API_KEY not set"
            return
            
        try:
            genai.configure(api_key=api_key)
            
            # List available models to find the right one
            available_model_names = []
            try:
                for m in genai.list_models():
                    methods = getattr(m, 'supported_generation_methods', [])
                    if 'generateContent' in methods:
                        available_model_names.append(m.name)
                print(f"Available Gemini models: {available_model_names[:10]}")
            except Exception as e:
                print(f"Could not list models: {e}")
                # Continue anyway - we'll try our predefined list
            
            # Try to use a model from the environment variable first
            env_model = os.environ.get('GEMINI_TEXT_MODEL')
            models_to_try = ([env_model] if env_model else []) + self.GEMINI_MODELS
            
            # Also add any available models we found
            for available in available_model_names:
                if available not in models_to_try and 'gemini' in available.lower():
                    models_to_try.append(available)
            
            # Try each model - don't test with a request (saves quota)
            for model_name in models_to_try:
                if not model_name:
                    continue
                try:
                    print(f"Trying Gemini model: {model_name}")
                    model = genai.GenerativeModel(model_name)
                    # Just check if model object is created successfully
                    # Skip test request to avoid rate limiting
                    self.gemini_model = model
                    self.active_model_name = model_name
                    print(f"✓ Gemini AI initialized with model: {model_name}")
                    self._init_error = None
                    return
                except Exception as e:
                    error_str = str(e).lower()
                    # If API key is invalid, no point trying other models
                    if 'api_key_invalid' in error_str or 'api key not found' in error_str or 'invalid api key' in error_str:
                        print(f"ERROR: Invalid GEMINI_API_KEY - get a new key from https://aistudio.google.com/app/apikey")
                        self.gemini_model = None
                        self._init_error = "Invalid API key"
                        return
                    print(f"✗ Model {model_name} failed: {str(e)[:100]}")
                    continue
            
            # If we have available models but none worked from our list, try the first available one
            if available_model_names:
                for available in available_model_names:
                    if 'gemini' in available.lower():
                        try:
                            print(f"Trying available model: {available}")
                            model = genai.GenerativeModel(available)
                            self.gemini_model = model
                            self.active_model_name = available
                            print(f"✓ Gemini AI initialized with model: {available}")
                            self._init_error = None
                            return
                        except Exception as e:
                            print(f"✗ Model {available} failed: {str(e)[:50]}")
                            continue
            
            print("ERROR: Could not initialize any Gemini model")
            self.gemini_model = None
            self._init_error = "No compatible Gemini model found - check API key"
            
        except Exception as e:
            print(f"Failed to initialize Gemini: {e}")
            self.gemini_model = None
            self._init_error = str(e)
        
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

    def estimate_price(self, make, model, year, specs, currency='JOD'):
        """Estimate car price based on make, model, year and specs."""
        self.load_models()
        
        # Base prices by make category (in JOD)
        luxury_makes = ['mercedes', 'bmw', 'audi', 'lexus', 'porsche', 'bentley', 'rolls-royce', 'maserati', 'jaguar', 'land rover', 'range rover']
        premium_makes = ['volvo', 'infiniti', 'acura', 'lincoln', 'cadillac', 'genesis', 'alfa romeo']
        standard_makes = ['toyota', 'honda', 'nissan', 'mazda', 'hyundai', 'kia', 'ford', 'chevrolet', 'volkswagen', 'subaru']
        budget_makes = ['suzuki', 'mitsubishi', 'renault', 'peugeot', 'citroen', 'fiat', 'dacia']
        
        make_lower = (make or '').lower()
        
        # Determine base price range
        if any(m in make_lower for m in luxury_makes):
            base_price = 45000
            variance = 0.35
        elif any(m in make_lower for m in premium_makes):
            base_price = 30000
            variance = 0.30
        elif any(m in make_lower for m in standard_makes):
            base_price = 18000
            variance = 0.25
        elif any(m in make_lower for m in budget_makes):
            base_price = 12000
            variance = 0.20
        else:
            base_price = 20000
            variance = 0.25
        
        # Adjust for year (depreciation)
        current_year = 2026
        if year:
            age = current_year - int(year)
            if age <= 0:
                base_price *= 1.1  # New car premium
            elif age <= 3:
                base_price *= (1 - age * 0.08)  # 8% per year for first 3 years
            elif age <= 7:
                base_price *= (0.76 - (age - 3) * 0.05)  # 5% per year for years 4-7
            else:
                base_price *= max(0.3, 0.56 - (age - 7) * 0.03)  # 3% per year after, min 30%
        
        # Adjust for specs
        if specs:
            if specs.get('horsepower'):
                hp = int(specs.get('horsepower', 0))
                if hp > 300:
                    base_price *= 1.15
                elif hp > 200:
                    base_price *= 1.05
            
            body_style = (specs.get('bodyStyle') or '').lower()
            if body_style in ['suv', 'crossover']:
                base_price *= 1.10
            elif body_style in ['coupe', 'convertible']:
                base_price *= 1.08
        
        # Calculate range
        low_price = base_price * (1 - variance)
        high_price = base_price * (1 + variance)
        
        return {
            'value': round(base_price),
            'low': round(low_price),
            'high': round(high_price),
            'currency': 'JOD'
        }

    def chat(self, message, history, image_base64=None):
        if not self.gemini_model:
            # Re-attempt initialization in case env was loaded after service init
            self._init_gemini()
            
        if not self.gemini_model:
            error = getattr(self, '_init_error', 'Unknown error')
            if 'Invalid API key' in error:
                return {'text': f"AI service error: Your Gemini API key is invalid. Please update it in the Render dashboard with a valid key from https://aistudio.google.com/app/apikey"}
            return {'text': f"I am the IntelliWheels AI Assistant. The AI service is currently unavailable. Error: {error}"}

        try:
            # Detect if message is in Arabic
            def is_arabic(text):
                if not text:
                    return False
                arabic_chars = sum(1 for c in text if '\u0600' <= c <= '\u06FF' or '\u0750' <= c <= '\u077F')
                return arabic_chars > len(text) * 0.3
            
            use_arabic = is_arabic(message) if message else False
            
            # Check history for Arabic as well
            if not use_arabic and history:
                for h in history[-3:]:
                    if is_arabic(h.get('text', '')):
                        use_arabic = True
                        break
            
            # Build conversation context
            if use_arabic:
                system_prompt = """أنت مساعد إنتلي ويلز الذكي، مستشار سيارات خبير لسوق السيارات في الأردن.
تساعد المستخدمين في:
- البحث عن السيارات ومقارنتها
- تقدير أسعار السوق العادلة
- إنشاء إعلانات السيارات
- الإجابة على أسئلة السيارات
- تحليل صور السيارات

مهم: جميع الأسعار بالدينار الأردني. هذا سوق أردني.
إذا أراد المستخدم بيع أو عرض سيارة، أو قدم تفاصيل (صورة، سعر، وصف) لغرض البيع، يجب عليك استخراج التفاصيل وإرجاع كتلة JSON في نهاية ردك بالشكل التالي:
```json_listing
{
  "make": "Company",
  "model": "Model",
  "year": 2020,
  "price": 10000,
  "currency": "JOD",
  "description": "...",
  "specs": { "color": "...", "transmission": "...", "odometer": 0 }
}
```

مرجع أسعار السيارات المستعملة في الأردن:
- اقتصادية (تويوتا ياريس، هوندا سيتي): 5,000 - 12,000 دينار
- متوسطة (تويوتا كامري، هوندا أكورد): 8,000 - 20,000 دينار
- فاخرة (BMW 3، مرسيدس C-Class): 15,000 - 35,000 دينار
- فخمة (BMW 7، مرسيدس S-Class): 30,000 - 80,000 دينار

كن مفيداً وموجزاً وعلى دراية بالسيارات. أجب دائماً باللغة العربية."""
            else:
                system_prompt = """You are IntelliWheels AI Assistant, an expert automotive consultant for a car marketplace in Jordan. 
You help users:
- Find and compare cars
- Estimate fair market prices
- Create car listings
- Answer automotive questions
- Analyze car images

IMPORTANT: All prices must be in JOD (Jordanian Dinar). This is a Jordanian marketplace.
If the user wants to list/sell a car, or provides car details (image, price, description) for listing, you MUST extract the vehicle details and return a JSON block at the very end of your response like this:
```json_listing
{
  "make": "Toyota",
  "model": "Camry",
  "year": 2020,
  "price": 15000,
  "currency": "JOD",
  "description": "...",
  "specs": { "color": "white", "transmission": "automatic", "odometer": 50000 }
}
```

Price references for used cars in Jordan:
- Economy (Toyota Yaris, Honda City): 5,000 - 12,000 JOD
- Mid-range (Toyota Camry, Honda Accord): 8,000 - 20,000 JOD  
- Premium (BMW 3-Series, Mercedes C-Class): 15,000 - 35,000 JOD
- Luxury (BMW 7-Series, Mercedes S-Class): 30,000 - 80,000 JOD

Be helpful, concise, and knowledgeable about cars."""

            # Build message content
            contents = []
            
            # Add history context
            if history:
                history_text = "\\n".join([f"{'User' if h.get('role') == 'user' else 'Assistant'}: {h.get('text', '')}" for h in history[-5:]])
                contents.append(f"Previous conversation:\\n{history_text}\\n\\n")
            
            # Add current message
            if message:
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
                    
                    prompt_parts = [system_prompt]
                    if contents:
                        prompt_parts.append("\\n".join(contents))
                    if not message:
                        prompt_parts.append("Please analyze this car image and provide details about the vehicle:")
                    prompt_parts.append(image_part)
                    
                    response_obj = self.gemini_model.generate_content(prompt_parts)
                except Exception as e:
                    print(f"Image processing error: {e}")
                    # Fall back to text-only if image fails
                    if message:
                        response_obj = self.gemini_model.generate_content([
                            system_prompt,
                            "\\n".join(contents)
                        ])
                    else:
                        return {'text': f"I couldn't process that image. Error: {str(e)[:100]}"}
            else:
                response_obj = self.gemini_model.generate_content([
                    system_prompt,
                    "\\n".join(contents)
                ])
            
            # Parse response for listing intent
            response_text = response_obj.text
            listing_data = None
            
            if '```json_listing' in response_text:
                try:
                    import re
                    match = re.search(r'```json_listing\s*({.*?})\s*```', response_text, re.DOTALL)
                    if match:
                        json_str = match.group(1)
                        listing_data = json.loads(json_str)
                        # Remove the JSON block from the user-facing text
                        response_text = response_text.replace(match.group(0), '').strip()
                except Exception as e:
                    print(f"Failed to parse listing JSON: {e}")

            return {
                'text': response_text,
                'listing_data': listing_data
            }
            
        except Exception as e:
            error_msg = str(e)
            print(f"Gemini API error: {error_msg}")
            # Provide clear error messages - prioritize API key errors
            error_lower = error_msg.lower()
            if any(x in error_lower for x in ['api_key', 'api key', 'invalid', 'authentication', '400', '401', '403']):
                return {'text': "AI service error: The API key needs to be updated. Please contact support or update GEMINI_API_KEY in your environment."}
            elif 'blocked' in error_lower or 'safety' in error_lower:
                return {'text': "I cannot process that request. Please rephrase your question."}
            elif 'quota' in error_lower or 'resource' in error_lower:
                return {'text': "AI service temporarily unavailable. Please try again in a few minutes."}
            return {'text': f"I encountered an issue: {error_msg[:150]}"}

    def _load_embeddings(self):
        """Load pre-computed car embeddings from file."""
        if hasattr(self, '_embeddings_cache') and self._embeddings_cache:
            return self._embeddings_cache
        
        import numpy as np
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        embeddings_path = os.path.join(base_dir, 'models', 'car_embeddings.json')
        
        if not os.path.exists(embeddings_path):
            print(f"[Embeddings] File not found: {embeddings_path}")
            return None
        
        try:
            with open(embeddings_path, 'r') as f:
                data = json.load(f)
            
            # Convert to numpy arrays for fast computation
            self._embeddings_cache = {
                item['car_id']: {
                    'text': item['text'],
                    'embedding': np.array(item['embedding'], dtype=np.float32)
                }
                for item in data
            }
            print(f"[Embeddings] Loaded {len(self._embeddings_cache)} car embeddings")
            return self._embeddings_cache
        except Exception as e:
            print(f"[Embeddings] Error loading: {e}")
            return None
    
    def _get_sentence_transformer(self):
        """Lazy-load sentence transformer model."""
        if hasattr(self, '_sentence_model') and self._sentence_model:
            return self._sentence_model
        
        try:
            from sentence_transformers import SentenceTransformer
            self._sentence_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
            print("[Semantic Search] Loaded SentenceTransformer model")
            return self._sentence_model
        except ImportError:
            print("[Semantic Search] sentence-transformers not installed, falling back to keyword search")
            return None
        except Exception as e:
            print(f"[Semantic Search] Error loading model: {e}")
            return None

    def semantic_search(self, query, limit):
        """Search cars using real transformer embeddings for true semantic similarity."""
        import re
        import numpy as np
        from ..db import get_db
        
        try:
            db = get_db()
            print(f"[Semantic Search] Query: '{query}'")
            
            # Get ALL cars from database
            cursor = db.execute("SELECT id, make, model, year, price, currency, image_url, specs FROM cars")
            all_cars = cursor.fetchall()
            print(f"[Semantic Search] Total cars in DB: {len(all_cars)}")
            
            if not all_cars:
                return []
            
            query_lower = query.lower()
            
            # Parse price constraints from query
            max_price = None
            min_price = None
            price_pattern = r'(?:under|below|less than|max|<)\s*(\d+)\s*k?'
            price_match = re.search(price_pattern, query_lower)
            if price_match:
                price_val = int(price_match.group(1))
                max_price = price_val * 1000 if price_val < 1000 else price_val
                print(f"[Semantic Search] Max price filter: {max_price}")
            
            min_price_pattern = r'(?:over|above|more than|min|>)\s*(\d+)\s*k?'
            min_price_match = re.search(min_price_pattern, query_lower)
            if min_price_match:
                price_val = int(min_price_match.group(1))
                min_price = price_val * 1000 if price_val < 1000 else price_val
            
            # Try to use transformer embeddings
            embeddings_cache = self._load_embeddings()
            model = self._get_sentence_transformer()
            
            scored_cars = []
            
            if model and embeddings_cache:
                # === TRUE SEMANTIC SEARCH with embeddings ===
                print("[Semantic Search] Using transformer embeddings")
                
                # Encode the query
                query_embedding = model.encode(query, normalize_embeddings=True)
                
                for row in all_cars:
                    car_id = row['id']
                    car_price = row['price'] or 0
                    
                    # Get pre-computed embedding for this car
                    car_data = embeddings_cache.get(car_id)
                    if not car_data:
                        continue
                    
                    # Compute cosine similarity (dot product since embeddings are normalized)
                    similarity = float(np.dot(query_embedding, car_data['embedding']))
                    
                    # Apply price filters (hard filter, not scoring)
                    if max_price and car_price > 0 and car_price > max_price:
                        continue  # Skip cars over budget
                    if min_price and car_price > 0 and car_price < min_price:
                        continue  # Skip cars under minimum
                    
                    scored_cars.append((similarity, row))
                
                print(f"[Semantic Search] Computed similarities for {len(scored_cars)} cars")
            else:
                # === FALLBACK: keyword-based search ===
                print("[Semantic Search] Falling back to keyword search")
                scored_cars = self._keyword_search(all_cars, query_lower, max_price, min_price)
            
            # Sort by similarity/score descending
            scored_cars.sort(key=lambda x: x[0], reverse=True)
            
            # Take top results
            top_results = scored_cars[:limit]
            
            if top_results:
                print(f"[Semantic Search] Top result: similarity={top_results[0][0]:.3f}")
            
            # Format results
            results = []
            max_score = top_results[0][0] if top_results else 1
            for score, row in top_results:
                specs = {}
                if row['specs']:
                    try:
                        specs = json.loads(row['specs'])
                    except:
                        pass
                
                # Normalize similarity score to 0-1 range
                similarity = round(min(score / max(max_score, 0.001), 1.0), 3)
                
                results.append({
                    "car": {
                        "id": row['id'],
                        "make": row['make'],
                        "model": row['model'],
                        "year": row['year'],
                        "price": row['price'],
                        "currency": row['currency'] or 'JOD',
                        "image": row['image_url'],
                        "description": specs.get('overview', f"{row['make']} {row['model']} {row['year']}")
                    },
                    "similarity": similarity,
                    "score": round(score, 3)
                })
            
            print(f"[Semantic Search] Results: {[(r['car']['make'], r['car']['model'], r['score']) for r in results]}")
            return results
            
        except Exception as e:
            import traceback
            print(f"[Semantic Search] ERROR: {e}")
            traceback.print_exc()
            return []
    
    def _keyword_search(self, all_cars, query_lower, max_price, min_price):
        """Fallback keyword-based search when embeddings aren't available."""
        import re
        
        # Extract keywords
        clean_query = re.sub(r'(?:under|below|less than|over|above|more than|max|min|<|>)\s*\d+\s*k?', '', query_lower)
        stop_words = {'car', 'cars', 'the', 'a', 'an', 'and', 'or', 'with', 'for', 'find', 'show', 'me', 'i', 'want', 'need', 'looking', 'search'}
        keywords = [w.strip() for w in clean_query.split() if len(w.strip()) > 1 and w.strip() not in stop_words]
        
        scored_cars = []
        for row in all_cars:
            score = 0.0
            car_make = (row['make'] or '').lower()
            car_model = (row['model'] or '').lower()
            car_price = row['price'] or 0
            car_specs_raw = row['specs'] or ''
            
            try:
                car_specs = json.loads(car_specs_raw) if car_specs_raw else {}
            except:
                car_specs = {}
            searchable = f"{car_make} {car_model} {json.dumps(car_specs).lower()}"
            
            # Score keyword matches
            for keyword in keywords:
                if keyword == car_make:
                    score += 50
                elif keyword in car_make:
                    score += 30
                elif keyword == car_model:
                    score += 45
                elif keyword in car_model:
                    score += 25
                elif keyword in searchable:
                    score += 10
            
            # Apply price filters
            if max_price and car_price > 0:
                if car_price <= max_price:
                    score += 15
                else:
                    score -= 20
            
            if min_price and car_price > 0:
                if car_price >= min_price:
                    score += 10
                else:
                    score -= 15
            
            if score > 0 or not keywords:
                scored_cars.append((score, row))
        
        return scored_cars

    def analyze_image(self, image_base64):
        if not self.gemini_model:
            self._init_gemini()
            
        if not self.gemini_model:
            error = getattr(self, '_init_error', 'AI service unavailable')
            return {
                "make": "",
                "model": "",
                "year": None,
                "bodyStyle": "",
                "estimatedPrice": None,
                "conditionDescription": f"AI Error: {error}",
                "error": True
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
    "estimatedPrice": estimated price in JOD (Jordanian Dinar) as a NUMBER ONLY,
    "currency": "JOD",
    "conditionDescription": "brief description of visible condition"
}

PRICE GUIDE for used cars in Jordan (JOD):
- Toyota Yaris/Corolla: 5,000 - 12,000 JOD
- Toyota Camry: 8,000 - 18,000 JOD
- Honda Civic/Accord: 7,000 - 16,000 JOD
- Hyundai/Kia compact: 4,000 - 10,000 JOD
- BMW 3-Series: 12,000 - 30,000 JOD
- Mercedes C-Class: 15,000 - 35,000 JOD
- Land Cruiser/Patrol: 25,000 - 60,000 JOD

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
            
            result = json.loads(response_text)
            result['error'] = False
            return result
            
        except json.JSONDecodeError as e:
            print(f"Vision JSON parse error: {e}, response was: {response_text[:200] if 'response_text' in dir() else 'N/A'}")
            return {
                "make": "",
                "model": "",
                "year": None,
                "bodyStyle": "",
                "estimatedPrice": None,
                "conditionDescription": "Could not parse AI response. Please try a clearer image.",
                "error": True
            }
        except Exception as e:
            print(f"Image analysis error: {e}")
            error_msg = str(e)
            error_lower = error_msg.lower()
            if 'blocked' in error_lower or 'safety' in error_lower:
                desc = "Image was blocked by safety filters. Please use a different image."
            elif any(x in error_lower for x in ['api_key', 'api key', 'invalid', 'authentication', '400', '401', '403']):
                desc = "AI service error: API key needs to be updated. Please contact support."
            elif 'quota' in error_lower or 'resource' in error_lower:
                desc = "AI service temporarily unavailable. Please try again later."
            else:
                desc = f"Analysis failed: {error_msg[:100]}"
            
            return {
                "make": "",
                "model": "",
                "year": None,
                "bodyStyle": "",
                "estimatedPrice": None,
                "conditionDescription": desc,
                "error": True
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
            # Detect if query is in Arabic
            def is_arabic(text):
                if not text:
                    return False
                arabic_chars = sum(1 for c in text if '\u0600' <= c <= '\u06FF' or '\u0750' <= c <= '\u077F')
                return arabic_chars > len(text) * 0.3
            
            use_arabic = is_arabic(query) if query else False
            
            # Check history for Arabic as well
            if not use_arabic and history:
                for h in history[-3:]:
                    if is_arabic(h.get('text', '')):
                        use_arabic = True
                        break
            
            if use_arabic:
                system_prompt = """أنت مساعد إعلانات السيارات لسوق إنتلي ويلز في الأردن. ساعد المستخدمين في إنشاء إعلانات السيارات.
جميع الأسعار بالدينار الأردني.

عندما يكون لديك معلومات كافية لإنشاء إعلان، أجب بصيغة JSON:
{
    "response": "رسالتك المفيدة باللغة العربية",
    "action_type": "draft",
    "listing_data": {
        "make": "...",
        "model": "...",
        "year": رقم,
        "price": رقم بالدينار,
        "currency": "JOD",
        "description": "الوصف بالعربية..."
    }
}

إذا كنت تحتاج مزيداً من المعلومات، أجب بشكل طبيعي بالعربية بدون listing_data."""
            else:
                system_prompt = """You are a car listing assistant for IntelliWheels marketplace in Jordan. Help users create car listings.
All prices must be in JOD (Jordanian Dinar).

When you have enough information to create a listing, respond with JSON in this format:
{
    "response": "your helpful message",
    "action_type": "draft",
    "listing_data": {
        "make": "...",
        "model": "...",
        "year": number,
        "price": number in JOD,
        "currency": "JOD",
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
            error_msg = str(e)
            error_lower = error_msg.lower()
            if any(x in error_lower for x in ['api_key', 'api key', 'invalid', 'authentication', '400', '401', '403']):
                response_text = "AI service error: API key needs to be updated. Please contact support."
            elif 'blocked' in error_lower or 'safety' in error_lower:
                response_text = "I cannot process that request. Please try a different question."
            else:
                response_text = f"I encountered an issue: {error_msg[:100]}"
            return {
                "success": True,
                "response": response_text,
                "action_type": None,
                "listing_data": None
            }

ai_service = AIService.get_instance()
