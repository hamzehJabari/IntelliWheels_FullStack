# Quick Setup Guide

## Step-by-Step Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Ingest the DriveArabia SQL dump

Make sure `data/Middle-East-GCC-Car-Database-by-Teoalida-SAMPLE.sql` is present, then run:

```bash
python ingest_excel_to_db.py
```

This will:
- Parse the `middle_east_gcc_car_database_sample` table
- Create `intelliwheels.db` SQLite database
- Consolidate Engine Specs rows into complete car entries

### 3. Configure API Key (Optional)

Edit `js/main.js` and replace the API key, or set environment variable:

```bash
export GEMINI_API_KEY="your-key-here"
```

### 4. Start Backend

```bash
python app.py
```

Or use the start script:
- Windows: `start.bat`
- Linux/Mac: `chmod +x start.sh && ./start.sh`

### 5. Open Frontend

Open `index.html` in your browser, or use a local server:

```bash
python -m http.server 8000
```

Then visit: `http://localhost:8000`

## Troubleshooting

**Database not found?**
- Run `python ingest_excel_to_db.py` first

**Backend not starting?**
- Check if port 5000 is available
- Make sure all dependencies are installed

**Chatbot not working?**
- Verify API key is set in `js/main.js`
- Check browser console for errors

**CORS errors?**
- Make sure backend is running on port 5000
- Check that Flask-CORS is installed

## Next Steps

1. ✅ Database is populated
2. ✅ Backend is running
3. ✅ Frontend is open
4. 🎉 Start using IntelliWheels!

## Features to Try

- Browse car listings
- Search and filter cars
- Add cars to favorites
- View detailed car information
- Ask the AI chatbot questions
- Add new car listings

