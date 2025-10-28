import { CallableRequest } from 'firebase-functions/v2/https';
import { db, handleError, storage, validateAuth } from '../utils/firebase';
import * as logger from 'firebase-functions/logger';
import * as puppeteer from 'puppeteer';
import * as admin from 'firebase-admin';

interface GeneratePDFRequest {
  attemptId: string;
}

/**
 * Function to generate a PDF report for an exam attempt
 */
export async function generatePDF(request: CallableRequest<GeneratePDFRequest>) {
  try {
    // Validate authentication
    const uid = validateAuth(request.auth || {});
    
    // Get attempt ID from request
    const { attemptId } = request.data;
    if (!attemptId) {
      throw new Error('Attempt ID is required');
    }
    
    // Get attempt document
    const attemptRef = db.collection('attempts').doc(attemptId);
    const attemptDoc = await attemptRef.get();
    
    if (!attemptDoc.exists) {
      throw new Error(`Attempt ${attemptId} not found`);
    }
    
    const attempt = attemptDoc.data();
    if (!attempt) {
      throw new Error('Invalid attempt data');
    }
    
    // Verify ownership
    if (attempt.userId !== uid) {
      throw new Error('You can only generate reports for your own attempts');
    }
    
    // Check if attempt is scored
    if (attempt.status !== 'scored') {
      throw new Error('Attempt must be scored before generating a report');
    }
    
    // Get user details for the report
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};
    
    // Get exam details
    const examRef = db.collection('exams').doc(attempt.examId);
    const examDoc = await examRef.get();
    const examData = examDoc.data() || {};
    
    // Get answers with correctness information
    const answersSnapshot = await db.collection('attempts')
      .doc(attemptId)
      .collection('items')
      .get();
    
    const answers = answersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get all question details
    const questionIds = answers.map(answer => answer.id);
    const questionsSnapshot = await db.collection('questions')
      .where('__name__', 'in', questionIds)
      .get();
    
    const questions = questionsSnapshot.docs.reduce((acc, doc) => {
      acc[doc.id] = { id: doc.id, ...doc.data() };
      return acc;
    }, {} as Record<string, any>);
    
    // Generate HTML content for PDF
    const htmlContent = generateReportHTML(attempt, examData, userData, answers, questions);
    
    // Launch Puppeteer and generate PDF
    logger.info('Launching Puppeteer to generate PDF');
    
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    
    // Generate PDF with good quality for printing
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
    });
    
    await browser.close();
    
    // Upload PDF to Firebase Storage
    const filename = `reports/${uid}/${attemptId}_${Date.now()}.pdf`;
    const fileRef = storage.bucket().file(filename);
    
    await fileRef.save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
      }
    });
    
    // Get download URL
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '03-01-2500', // Far future expiration
    });
    
    // Update attempt with report URL
    await attemptRef.update({
      reportUrl: url,
      reportGenerated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    logger.info(`Successfully generated report for attempt ${attemptId}`);
    
    return {
      success: true,
      attemptId,
      reportUrl: url
    };
    
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Generate HTML content for the PDF report
 */
function generateReportHTML(
  attempt: any, 
  exam: any, 
  user: any, 
  answers: any[], 
  questions: Record<string, any>
): string {
  // Format date
  const date = attempt.submittedAt ? 
    new Date(attempt.submittedAt.seconds * 1000).toLocaleDateString() : 
    new Date().toLocaleDateString();
  
  // Calculate statistics
  const totalQuestions = answers.length;
  const correctAnswers = answers.filter(a => a.correctBool).length;
  const incorrectAnswers = totalQuestions - correctAnswers;
  const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
  
  // Sort answers by section and question number
  const sortedAnswers = [...answers].sort((a, b) => {
    const qA = questions[a.id];
    const qB = questions[b.id];
    
    if (!qA || !qB) return 0;
    
    if (qA.section !== qB.section) {
      return qA.section.localeCompare(qB.section);
    }
    
    return qA.order - qB.order;
  });
  
  // Generate section-wise performance table
  const sections = attempt.score?.sections || [];
  const sectionRows = sections.map(section => `
    <tr>
      <td>${section.name}</td>
      <td>${section.correct}</td>
      <td>${section.total - section.correct}</td>
      <td>${section.total}</td>
      <td>${Math.round(section.accuracy)}%</td>
    </tr>
  `).join('');
  
  // Generate question review items
  const questionReviews = sortedAnswers.map((answer, idx) => {
    const question = questions[answer.id];
    if (!question) return '';
    
    const options = question.options.map((opt: string, i: number) => {
      const isSelected = answer.selectedIdx === i;
      const isCorrect = question.correctIndex === i;
      
      let optionClass = '';
      if (isSelected && isCorrect) {
        optionClass = 'correct-selected';
      } else if (isSelected && !isCorrect) {
        optionClass = 'incorrect-selected';
      } else if (isCorrect) {
        optionClass = 'correct';
      }
      
      return `
        <div class="option ${optionClass}">
          <span class="option-marker">${String.fromCharCode(65 + i)}</span>
          <span class="option-text">${opt}</span>
        </div>
      `;
    }).join('');
    
    return `
      <div class="question-review">
        <div class="question-header">
          <span class="question-number">Q${idx + 1}.</span>
          <span class="question-section">${question.section || 'General'}</span>
          <span class="question-difficulty">${question.difficulty || 'Medium'}</span>
        </div>
        <div class="question-stem">${question.stem}</div>
        <div class="options-container">
          ${options}
        </div>
        <div class="explanation">
          <h4>Explanation:</h4>
          <p>${question.explanation}</p>
        </div>
      </div>
    `;
  }).join('');
  
  // Generate complete HTML document
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Exam Result Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .report-container {
          max-width: 100%;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #ddd;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #4a154b;
        }
        .exam-title {
          font-size: 22px;
          margin: 10px 0;
        }
        .student-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .info-group {
          flex: 1;
        }
        .info-item {
          margin-bottom: 8px;
        }
        .label {
          font-weight: bold;
        }
        .summary-box {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 30px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .score-highlight {
          font-size: 24px;
          font-weight: bold;
          color: #4a154b;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        .question-review {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .question-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
        }
        .question-stem {
          font-weight: bold;
          margin-bottom: 10px;
        }
        .options-container {
          margin-bottom: 15px;
        }
        .option {
          display: flex;
          padding: 8px;
          margin-bottom: 8px;
          border-radius: 4px;
          background-color: #fff;
          border: 1px solid #ddd;
        }
        .option-marker {
          font-weight: bold;
          margin-right: 10px;
          min-width: 20px;
        }
        .correct {
          background-color: rgba(76, 175, 80, 0.1);
          border: 1px solid #4caf50;
        }
        .correct-selected {
          background-color: rgba(76, 175, 80, 0.2);
          border: 1px solid #4caf50;
        }
        .incorrect-selected {
          background-color: rgba(244, 67, 54, 0.1);
          border: 1px solid #f44336;
        }
        .explanation {
          background-color: #fff;
          padding: 10px;
          border-radius: 4px;
          border: 1px solid #ddd;
        }
        .explanation h4 {
          margin-top: 0;
          margin-bottom: 8px;
          color: #4a154b;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #ddd;
          font-size: 12px;
          color: #666;
        }
        @media print {
          .page-break {
            page-break-before: always;
          }
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="header">
          <div class="logo">ExamPlatform</div>
          <h1 class="exam-title">${exam.name || 'Exam'} - Performance Report</h1>
        </div>
        
        <div class="student-info">
          <div class="info-group">
            <div class="info-item">
              <span class="label">Student Name:</span> ${user.displayName || 'N/A'}
            </div>
            <div class="info-item">
              <span class="label">Email:</span> ${user.email || 'N/A'}
            </div>
            <div class="info-item">
              <span class="label">Target Exam:</span> ${user.targetExam || exam.code || 'N/A'}
            </div>
          </div>
          
          <div class="info-group">
            <div class="info-item">
              <span class="label">Attempt Date:</span> ${date}
            </div>
            <div class="info-item">
              <span class="label">Time Taken:</span> ${Math.round((attempt.score?.totalTimeMs || 0) / 60000)} minutes
            </div>
            <div class="info-item">
              <span class="label">Report Generated:</span> ${new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div class="summary-box">
          <h2>Performance Summary</h2>
          <div class="info-item">
            <span class="label">Overall Score:</span> 
            <span class="score-highlight">
              ${attempt.score?.raw || 0}/${totalQuestions} (${accuracy}%)
            </span>
          </div>
          <div class="info-item">
            <span class="label">Correct Answers:</span> ${correctAnswers}
          </div>
          <div class="info-item">
            <span class="label">Incorrect Answers:</span> ${incorrectAnswers}
          </div>
          <div class="info-item">
            <span class="label">Percentile:</span> ${Math.round(attempt.score?.percentile || 0)}%
          </div>
          <div class="info-item">
            <span class="label">Avg. Time Per Question:</span> 
            ${Math.round((attempt.score?.avgTimePerQuestionMs || 0) / 1000)} seconds
          </div>
        </div>
        
        <h2>Section-wise Performance</h2>
        <table>
          <thead>
            <tr>
              <th>Section</th>
              <th>Correct</th>
              <th>Incorrect</th>
              <th>Total</th>
              <th>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            ${sectionRows}
          </tbody>
        </table>
        
        <div class="page-break"></div>
        
        <h2>Question Review</h2>
        ${questionReviews}
        
        <div class="footer">
          <p>This is an auto-generated report by ExamPlatform.</p>
          <p>© ${new Date().getFullYear()} ExamPlatform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}