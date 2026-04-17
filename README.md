# PolicyLens - AI-Powered Insurance Policy Analyzer MVP

A full-stack web application that analyzes insurance policy PDFs using OpenAI's GPT-4o-mini model to extract covered events, exclusions, risky clauses, and provide a coverage score.

## 🏗️ Architecture

**Clean Backend Structure:**
```
routes/ → controllers/ → services/ → validators/ → utils/
```

- **routes/**: API endpoint definitions
- **controllers/**: Request handling and validation
- **services/**: Business logic and OpenAI integration
- **validators/**: Input validation
- **utils/**: Helper functions (PDF extraction, etc.)

**Frontend:**
- Next.js 14 with TypeScript
- Tailwind CSS with light theme
- Component-based architecture
- Real-time upload and analysis

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- OpenAI API Key

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your OPENAI_API_KEY to .env
uvicorn main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`

Swagger Docs: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend will be available at `http://localhost:3000`

## 📋 Environment Variables

### Backend (`.env`)
```env
OPENAI_API_KEY=your_key_here
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🎯 Features

- **PDF Upload**: Drag & drop or select insurance policy PDFs
- **AI Analysis**: GPT-4o-mini analyzes policies with JSON mode
- **Coverage Score**: Visual 0-10 rating with animated progress bar
- **Covered Events**: List of what's included
- **Exclusions**: Important limitations to know
- **Risky Clauses**: Potentially problematic terms
- **Error Handling**: User-friendly error messages
- **File Validation**: Size limits (max 10MB) and type checking

## 🔌 API Endpoints

### POST `/api/analyze`
Analyze an insurance policy PDF.

**Request:**
```
multipart/form-data
- file: PDF file (max 10MB, required)
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "covered_events": ["string array"],
    "exclusions": ["string array"],
    "risky_clauses": ["string array"],
    "coverage_score": 7
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "human readable error message"
}
```

## 🎨 Design System

- **Theme**: Light mode only
- **Primary Color**: #2563EB (Blue)
- **Background**: #F9FAFB
- **Typography**: DM Sans (Google Fonts)
- **Spacing**: Consistent padding/margins
- **Shadows**: Subtle (shadow-sm)
- **Rounded Corners**: 2xl (16px)

## 📦 Dependencies

### Backend
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `pymupdf` - PDF text extraction
- `openai` - OpenAI API client
- `python-dotenv` - Environment variables
- `python-multipart` - File uploads

### Frontend
- `next` - React framework
- `react` - UI library
- `tailwindcss` - Styling
- `lucide-react` - Icons
- `typescript` - Type safety

## 🧪 Testing Checklist

- [ ] Backend starts successfully
- [ ] Frontend starts successfully
- [ ] CORS working (no browser console errors)
- [ ] Valid PDF → Returns complete analysis
- [ ] Non-PDF file → 400 error
- [ ] PDF > 10MB → Rejected before upload
- [ ] Empty PDF → 400 error with message
- [ ] Network error → User sees error message
- [ ] Analysis displays all 4 sections correctly

## 🚫 What's NOT Included

- Database
- Authentication/Authorization
- User accounts
- File storage
- PDF chunking for large documents
- Multiple analysis types
- History/saved analyses

## 🔐 Security Notes

- Store `OPENAI_API_KEY` securely (never commit to git)
- File size validated on backend (10MB limit)
- PDF type checking (`.pdf` extension + MIME type)
- Error messages sanitized

## 📝 Error Codes

- **400 Bad Request**: Invalid PDF, missing file, file too large, empty PDF text
- **500 Internal Server Error**: OpenAI API error, JSON parse error

## 🚀 Deployment

### Environment Variables
Update `.env` (backend) and `.env.local` (frontend) with production values.

### Backend
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
npm run build
npm start
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [PyMuPDF Documentation](https://pymupdf.readthedocs.io/)

## 🎯 Next Steps for Enhancement

1. Add authentication (JWT tokens)
2. Implement database (PostgreSQL)
3. Save analysis history
4. Add more AI features (policy comparison, terms extraction)
5. Multi-language support
6. Mobile app version
7. Batch PDF processing
8. Custom analysis types

## 📄 License

MIT

## 🤝 Support

For issues or questions, please refer to the respective framework documentation or create an issue in the repository.

---

**Version**: 1.0.0  
**Last Updated**: April 2, 2026  
**Status**: MVP Ready
