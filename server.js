// server.js
const express = require('express');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const port = 3000;

// Middleware to parse incoming form-data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint to handle file uploads
app.post('/upload', (req, res) => {
  const form = new formidable.IncomingForm();
  form.uploadDir = path.join(__dirname, 'uploaded_files');
  form.keepExtensions = true;
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error processing the files.' });
    }

    // Extract file path
    const file = files.file[0];
    const filePath = file.filepath;

    try {
      // Read the file content
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      // Send file content to Gemini API
      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyAJQICrt6u5D48UW-a6dHFphnI5zLpVWLo',
        {
          contents: [
            {
              parts: [
                {
                  text: `Answer the following query based on the provided text content:\n\n${fields.query}\n\nText Content:\n${fileContent}`
                }
              ]
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const generatedText = response.data.candidates[0]?.content?.parts[0]?.text || 'No response generated.';
      res.json({ response: generatedText });
      
    } catch (error) {
      console.error('Error sending request to Gemini API:', error);
      res.status(500).json({ error: 'Error communicating with Gemini API.' });
    } finally {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
