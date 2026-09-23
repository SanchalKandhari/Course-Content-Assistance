# Course Content Assistance AI

An intelligent, Azure AI-powered application designed to help students study their course materials more effectively. The application extracts content from uploaded documents and uses a specialized AI agent to answer questions and dynamically generate interactive flashcards.

## 🚀 Features

- **Azure AI Foundry Integration**: Uses the `gpt-5-mini` model to provide accurate, strictly context-bound answers.
- **Smart Document Processing**: Upload PDFs or course materials; the app parses and extracts the text locally to feed context to the AI.
- **Interactive Flashcards**: Automatically generates Multiple Choice and Assertion/Reasoning questions based *only* on your uploaded materials.
- **Actionable Study Tips**: Provides targeted feedback if you answer a flashcard incorrectly.
- **Cross-Platform**: Works seamlessly on any operating system (Windows, macOS, Linux, iOS, Android) via the browser.

## 🔗 Live Demo
*(You can deploy your project to Vercel/Netlify for free and put the link here so recruiters can just click and view it!)*

## 💻 How to Run Locally (For Recruiters & Developers)

If you would like to run this project on your local machine, follow these steps:

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- An Azure AI Foundry API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SanchalKandhari/Course-Content-Assistance.git
   cd Course-Content-Assistance
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your Azure credentials:
   ```env
   VITE_FOUNDRY_ENDPOINT="your_azure_ai_endpoint_here"
   VITE_FOUNDRY_API_KEY="your_azure_api_key_here"
   ```
   *(Note: You can also input your API key directly in the application's Settings menu UI).*

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

5. **Open the Application:**
   Open your browser and navigate to `http://localhost:5173`.

## 🛠️ Technology Stack
- **Frontend**: React.js, Vite, Vanilla CSS
- **AI Integration**: `@azure/ai-projects`, Azure AI Foundry
- **Document Processing**: `pdfjs-dist`
