const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON Parse Error:', err.message);
    return res.status(400).json({ error: 'Invalid JSON in request body', details: err.message });
  }
  next(err);
});

// Helper function to read and write JSON files
const readJsonFile = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return null;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
};

const writeJsonFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    return false;
  }
};

// Validate required fields for data objects
const validateFaqData = (data) => {
  if (!data.id || !data.question || !data.answer) {
    return false;
  }
  return true;
};

const validateFeedbackData = (data) => {
  if (!data.question || !data.answer || !data.feedback) {
    return false;
  }
  return true;
};

const validateQuestionData = (data) => {
  if (!data.question) {
    return false;
  }
  return true;
};

// Add timestamp and ID to entries if not provided
const addMetadata = (data, prefix = 'id') => {
  if (!data.timestamp) {
    data.timestamp = new Date().toISOString();
  }
  
  if (!data.id) {
    data.id = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }
  
  return data;
};

// Endpoints
app.all('/data', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'lib', 'data.json');
    const currentData = readJsonFile(filePath);
    
    if (!currentData) {
      return res.status(500).json({ error: 'Could not read data file' });
    }
    
    if (req.method === 'POST') {
      const newData = req.body;
      
      // Validate required fields
      if (!validateFaqData(newData)) {
        return res.status(400).json({ 
          error: 'Invalid data format', 
          message: 'FAQ entries require id, question, and answer fields'
        });
      }
      
      // Check if faqs array exists
      if (!Array.isArray(currentData.faqs)) {
        return res.status(500).json({ error: 'Invalid data structure in data.json' });
      }
      
      // Add metadata if not provided
      const enhancedData = addMetadata(newData, 'faq');
      
      currentData.faqs.push(enhancedData);
      
      if (writeJsonFile(filePath, currentData)) {
        return res.status(201).json({ 
          success: true, 
          message: 'Data added successfully', 
          data: enhancedData 
        });
      } else {
        return res.status(500).json({ error: 'Failed to write to data file' });
      }
    }
    
    res.json(currentData);
  } catch (error) {
    console.error('Error in /data endpoint:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

app.all('/feedback', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'lib', 'feedback.json');
    const currentFeedback = readJsonFile(filePath);
    
    if (!currentFeedback) {
      return res.status(500).json({ error: 'Could not read feedback file' });
    }
    
    if (req.method === 'POST') {
      const newFeedback = req.body;
      
      // Validate required fields
      if (!validateFeedbackData(newFeedback)) {
        return res.status(400).json({ 
          error: 'Invalid data format', 
          message: 'Feedback entries require question, answer, and feedback fields'
        });
      }
      
      // Check if feedback array exists
      if (!Array.isArray(currentFeedback.feedback)) {
        return res.status(500).json({ error: 'Invalid data structure in feedback.json' });
      }
      
      // Add metadata if not provided
      const enhancedFeedback = addMetadata(newFeedback, 'fb');
      
      currentFeedback.feedback.push(enhancedFeedback);
      
      if (writeJsonFile(filePath, currentFeedback)) {
        return res.status(201).json({ 
          success: true, 
          message: 'Feedback added successfully', 
          feedback: enhancedFeedback 
        });
      } else {
        return res.status(500).json({ error: 'Failed to write to feedback file' });
      }
    }
    
    res.json(currentFeedback);
  } catch (error) {
    console.error('Error in /feedback endpoint:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

app.all('/questions', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'lib', 'questions.json');
    const currentData = readJsonFile(filePath);
    
    if (!currentData) {
      return res.status(500).json({ error: 'Could not read questions file' });
    }
    
    if (req.method === 'POST') {
      const newQuestion = req.body;
      
      // Validate required fields
      if (!validateQuestionData(newQuestion)) {
        return res.status(400).json({ 
          error: 'Invalid data format', 
          message: 'Question entries require a question field'
        });
      }
      
      // Check if questions array exists
      if (!Array.isArray(currentData.questions)) {
        return res.status(500).json({ error: 'Invalid data structure in questions.json' });
      }
      
      // Add metadata if not provided
      const enhancedQuestion = addMetadata(newQuestion, 'q');
      
      currentData.questions.push(enhancedQuestion);
      
      if (writeJsonFile(filePath, currentData)) {
        return res.status(201).json({ 
          success: true, 
          message: 'Question added successfully', 
          question: enhancedQuestion 
        });
      } else {
        return res.status(500).json({ error: 'Failed to write to questions file' });
      }
    }
    
    res.json(currentData);
  } catch (error) {
    console.error('Error in /questions endpoint:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});