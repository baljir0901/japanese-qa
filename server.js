const express = require('express');
const path = require('path');
const { translate } = require('@vitalets/google-translate-api');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const crypto = require('crypto');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'baljir0901@gmail.com',
        pass: process.env.EMAIL_PASS || 'fxk brhp ndxq pmkn'
    }
});

// Generate unique filename for PDF
const generateFileName = () => {
    return `response_${crypto.randomBytes(8).toString('hex')}.pdf`;
};

// Generate PDF function with improved error handling
async function generatePDF(questionJP, answerJP) {
    const pdfPath = path.join(__dirname, 'temp', generateFileName());
    
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const writeStream = fs.createWriteStream(pdfPath);

        // Handle stream errors
        writeStream.on('error', (error) => {
            reject(new Error(`PDF write stream error: ${error.message}`));
        });

        doc.on('error', (error) => {
            reject(new Error(`PDFDocument error: ${error.message}`));
        });

        writeStream.on('finish', () => resolve(pdfPath));

        // Add content
        doc.pipe(writeStream);
        
        // Add metadata
        doc.info.Title = 'Japanese Q&A Response';
        doc.info.Author = 'Translation Service';

        // Add content with better formatting
        doc.fontSize(20).font('Helvetica-Bold')
           .text('Japanese Q&A Response', { align: 'center' });
        
        doc.moveDown(2);
        doc.fontSize(14).font('Helvetica-Bold')
           .text('Question:', { continued: true })
           .font('Helvetica')
           .text(` ${questionJP}`);
        
        doc.moveDown();
        doc.fontSize(14).font('Helvetica-Bold')
           .text('Answer:', { continued: true })
           .font('Helvetica')
           .text(` ${answerJP}`);
        
        doc.end();
    });
}

// Input validation middleware
const validateInput = (req, res, next) => {
    const { language, name, email } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }
    
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    next();
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.post('/submit', validateInput, async (req, res) => {
    console.log('Received request:', req.body);
    
    try {
        const { name, email } = req.body;

        // Translate with error handling
        const [questionJP, answerJP] = await Promise.all([
            translate('What is your name?', { to: 'ja' }),
            translate(name, { to: 'ja' })
        ]).catch(error => {
            throw new Error(`Translation failed: ${error.message}`);
        });

        // Generate PDF
        const pdfPath = await generatePDF(questionJP.text, answerJP.text);

        // Send email
        const mailOptions = {
            from: process.env.EMAIL_USER || 'baljir0901@gmail.com',
            to: email,
            subject: 'Your Japanese Q&A Response',
            text: 'Please find your translated Q&A attached.',
            attachments: [{
                filename: 'japanese_qa.pdf',
                path: pdfPath
            }]
        };

        await transporter.sendMail(mailOptions);

        // Clean up PDF file
        await fs.unlink(pdfPath).catch(console.error);

        res.json({ 
            success: true,
            translations: {
                question: questionJP.text,
                answer: answerJP.text
            }
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'An error occurred processing your request',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something broke!',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});