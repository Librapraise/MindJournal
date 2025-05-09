# Mental Health Journal API

A secure, AI-powered journaling application that helps users track their mental well-being and receive intelligent insights about their emotional patterns.

## 🌟 Features

### Core Functionality

- **Secure Authentication**: JWT-based authentication system with password hashing
- **Journal Management**: Create, read, update, and delete journal entries
- **Mood Tracking**: Track emotional states over time
- **AI-Powered Analysis**:
  - Sentiment analysis of entries
  - Theme identification
  - Personalized coping strategies
  - Smart journaling prompts

### Technical Features

- **Modern FastAPI Backend**: High-performance async API with automatic OpenAPI documentation
- **AI Integration**: Flexible LLM support (OpenAI)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Security**:
  - CORS protection
  - Password hashing with bcrypt
  - JWT authentication
  - Input validation
- **GDPR Compliance**: Data export and deletion capabilities

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- PostgreSQL
- Google Gemini API key or OpenAI API key

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/mental-health-journal-api.git
cd mental-health-journal-api
```

2. **Create and activate virtual environment**

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Set up environment variables**
   Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/db_name
SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key
DEFAULT_LLM_PROVIDER=gemini  # or openai
ALLOWED_ORIGINS=http://localhost:3000
```

5. **Initialize the database**

```bash
# The tables will be created automatically on first run
python -m app.main
```

### Running the Application

**Development**

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Production**

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 📚 API Documentation

Once the application is running, access the interactive API documentation:

- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`

### Key Endpoints

#### Authentication

- `POST /api/v1/users/`: Register new user
- `POST /api/v1/auth/token`: Login and get access token

#### Journal

- `POST /api/v1/journal/`: Create new journal entry
- `GET /api/v1/journal/`: List user's journal entries
- `GET /api/v1/journal/{entry_id}`: Get specific entry
- `GET /api/v1/journal/insights/`: Get mood and theme analytics
- `GET /api/v1/journal/prompt/`: Get AI-generated journaling prompt

#### User Data

- `GET /api/v1/users/me`: Get current user profile
- `GET /api/v1/users/me/export`: Export all user data (GDPR)
- `DELETE /api/v1/users/me`: Delete account and all data

## 🔒 Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens expire after 30 minutes
- Database credentials and API keys must be secured
- CORS is configured to allow only specified origins
- Input validation on all endpoints
- Rate limiting on authentication endpoints
- Secure headers middleware enabled

### Development Guidelines

- Use Black for code formatting
- Follow PEP 8 style guide
- Write tests for new features
- Update documentation for API changes
- Use type hints

## 📦 Deployment

### Vercel Deployment

The project includes a `vercel.json` configuration for easy deployment to Vercel:

```json
{
  "builds": [{ "src": "app/main.py", "use": "@vercel/python" }],
  "routes": [{ "src": "/(.*)", "dest": "app/main.py" }]
}
```

### Other Platforms

- Ensure PostgreSQL database is accessible
- Set all environment variables
- Configure CORS for production domain
- Set up SSL/TLS
- Configure proper logging
- Set up monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 🙏 Acknowledgments

- FastAPI framework
- SQLAlchemy ORM
- Google Gemini AI
- OpenAI GPT
- LangChain framework
