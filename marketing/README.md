# IntelliWheels Roll-Up Banner

## Specifications
- **Dimensions:** 850mm × 2000mm (standard roll-up banner size)
- **Resolution:** Designed for 300 DPI print quality
- **File:** `rollup-banner.html`

## How to Use

### Option 1: Print from Browser (Quick)
1. Open `rollup-banner.html` in Google Chrome or Firefox
2. Press `Ctrl + P` (Windows) or `Cmd + P` (Mac)
3. Set destination to "Save as PDF"
4. Set paper size to "Custom" → 850mm × 2000mm
5. Margins: None
6. Scale: 100%
7. Save and send to print shop

### Option 2: Professional Print (Recommended)
1. Open `rollup-banner.html` in browser
2. Take a full-page screenshot or use browser developer tools
3. Export to high-resolution PNG/PDF
4. Import into Adobe Illustrator/InDesign for final adjustments
5. Export as print-ready PDF (CMYK, 300 DPI, with bleed)

### Option 3: Use Online Converter
1. Use tools like:
   - wkhtmltopdf (command line)
   - Puppeteer (Node.js)
   - Online HTML to PDF converters
2. Set custom page size to 850mm × 2000mm

## Design Elements

### Color Palette (Brand Colors)
| Color | Hex | Usage |
|-------|-----|-------|
| Primary Dark | #020617 | Background |
| Primary Blue | #0ea5e9 | Accents, highlights |
| Secondary Blue | #38bdf8 | Interactive elements |
| Accent Indigo | #6366f1 | AI features |
| Accent Emerald | #10b981 | Success, checks |
| Text White | #ffffff | Main text |
| Text Light | #e2e8f0 | Secondary text |
| Text Muted | #94a3b8 | Tertiary text |

### Typography
- **Font Family:** Inter (Google Fonts)
- **Weights Used:** 300, 400, 500, 600, 700, 800, 900

### Content Sections
1. **Header** - Logo, tagline (English + Arabic)
2. **Headline** - Main value proposition
3. **Features** - 4 key AI capabilities
4. **Stats** - Key metrics
5. **Benefits** - 6 reasons to choose IntelliWheels
6. **CTA** - Call to action with website
7. **Footer** - Domain, regions, QR code placeholder

## Customization

### To add QR Code:
1. Generate QR code from [qr-code-generator.com](https://www.qr-code-generator.com/) for intelliwheels.co
2. Replace the QR placeholder div with an `<img>` tag
3. Recommended QR size: 120mm × 120mm

### To update stats:
Edit the `.stat-number` spans in the HTML file with your current metrics

### Logo Path:
The banner references `../public/intellliwheels_logo_concept_dynamic_NO_BG.png`
Update the path if using a different logo file.

## Print Shop Instructions
When submitting to a print shop, request:
- Material: Premium vinyl or fabric
- Finish: Matte (recommended for indoor use)
- Include: Roll-up stand/mechanism
- Bleed: Add 5mm bleed if required

## Files in this folder
- `rollup-banner.html` - Main banner file
- `README.md` - This documentation
