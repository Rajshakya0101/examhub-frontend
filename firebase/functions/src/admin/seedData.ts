import { CallableRequest } from 'firebase-functions/v2/https';
import { db, handleError, validateAuth, validateRole } from '../utils/firebase';
import * as logger from 'firebase-functions/logger';
import { examSchema } from '../shared/schema';

interface SeedDataRequest {
  type: 'exams' | 'questions' | 'users' | 'all';
}

/**
 * Seed initial data for the application (admin only)
 */
export async function seedData(request: CallableRequest<SeedDataRequest>) {
  try {
    // Validate authentication
    const uid = validateAuth(request.auth || {});
    
    // Validate admin role
    await validateRole(uid, ['admin']);
    
    // Get request parameters
    const { type = 'all' } = request.data;
    
    logger.info(`Starting data seeding process for ${type}`);
    
    if (type === 'exams' || type === 'all') {
      await seedExams();
    }
    
    if (type === 'questions' || type === 'all') {
      await seedQuestions();
    }
    
    if (type === 'users' || type === 'all') {
      await seedUsers();
    }
    
    return {
      success: true,
      message: `Successfully seeded ${type} data`
    };
    
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Seed initial exam data
 */
async function seedExams() {
  logger.info('Seeding exam data');
  
  const exams = [
    {
      name: 'SSC CGL',
      code: 'ssc-cgl',
      durationSec: 7200,
      negativeMarking: 0.25,
      uiTheme: 'ssc',
      sections: [
        {
          id: 'general-intelligence',
          title: 'General Intelligence & Reasoning',
          questionCount: 25,
          order: 1,
          hasSectionTimer: false
        },
        {
          id: 'general-awareness',
          title: 'General Awareness',
          questionCount: 25,
          order: 2,
          hasSectionTimer: false
        },
        {
          id: 'quantitative-aptitude',
          title: 'Quantitative Aptitude',
          questionCount: 25,
          order: 3,
          hasSectionTimer: false
        },
        {
          id: 'english-comprehension',
          title: 'English Comprehension',
          questionCount: 25,
          order: 4,
          hasSectionTimer: false
        }
      ],
      rules: {
        backNav: true,
        optionShuffle: true
      },
      topics: [
        'Verbal Reasoning',
        'Non-Verbal Reasoning',
        'Current Affairs',
        'History',
        'Geography',
        'Economic Scene',
        'General Policy',
        'Scientific Research',
        'Arithmetic',
        'Algebra',
        'Geometry',
        'Mensuration',
        'Statistical Charts',
        'Reading Comprehension',
        'Vocabulary',
        'Grammar',
        'Sentence Structure'
      ],
      status: 'active',
      visibility: 'public',
      isPopular: true
    },
    {
      name: 'Bank PO',
      code: 'bank-po',
      durationSec: 3600,
      negativeMarking: 0.25,
      uiTheme: 'banking',
      sections: [
        {
          id: 'reasoning',
          title: 'Reasoning',
          questionCount: 35,
          order: 1,
          hasSectionTimer: true
        },
        {
          id: 'quantitative-aptitude',
          title: 'Quantitative Aptitude',
          questionCount: 35,
          order: 2,
          hasSectionTimer: true
        },
        {
          id: 'english-language',
          title: 'English Language',
          questionCount: 30,
          order: 3,
          hasSectionTimer: true
        }
      ],
      rules: {
        backNav: false,
        optionShuffle: true
      },
      topics: [
        'Logical Reasoning',
        'Alphanumeric Series',
        'Data Interpretation',
        'Number Series',
        'Simplification',
        'Interest',
        'Reading Comprehension',
        'Grammar',
        'Vocabulary',
        'Verbal Ability'
      ],
      status: 'active',
      visibility: 'public',
      isPopular: true
    }
  ];
  
  // Validate exams against schema
  for (const exam of exams) {
    try {
      examSchema.parse(exam);
    } catch (error) {
      logger.error(`Invalid exam data: ${error}`);
      throw new Error(`Invalid exam data: ${error}`);
    }
  }
  
  // Add exams to Firestore
  const batch = db.batch();
  
  for (const exam of exams) {
    const examRef = db.collection('exams').doc(exam.code);
    batch.set(examRef, {
      ...exam,
      createdAt: new Date()
    });
    logger.info(`Added exam: ${exam.name}`);
  }
  
  await batch.commit();
  logger.info('Finished seeding exam data');
}

/**
 * Seed initial question data
 */
async function seedQuestions() {
  logger.info('Seeding question data');
  
  // Sample questions for SSC CGL
  const sscQuestions = [
    {
      examId: 'ssc-cgl',
      section: 'general-intelligence',
      topic: 'Verbal Reasoning',
      type: 'mcq',
      stem: 'If FRIEND is coded as HUMJTK, how is CANDLE coded?',
      options: ['EDRIRL', 'DCQHQK', 'ESJFME', 'DEQJQM'],
      correctIndex: 1,
      explanation: 'Each letter in FRIEND is moved forward by 2 positions to get HUMJTK. Similarly, each letter in CANDLE is moved forward by 2 positions to get DCQHQK.',
      difficulty: 'medium',
      tags: ['Coding-Decoding'],
      status: 'live'
    },
    {
      examId: 'ssc-cgl',
      section: 'general-awareness',
      topic: 'Current Affairs',
      type: 'mcq',
      stem: 'Who is the author of the book "A Promised Land"?',
      options: ['Michelle Obama', 'Joe Biden', 'Barack Obama', 'Kamala Harris'],
      correctIndex: 2,
      explanation: '"A Promised Land" is a memoir by Barack Obama, the 44th President of the United States, published in November 2020.',
      difficulty: 'easy',
      tags: ['Books and Authors'],
      status: 'live'
    }
  ];
  
  // Sample questions for Bank PO
  const bankQuestions = [
    {
      examId: 'bank-po',
      section: 'reasoning',
      topic: 'Logical Reasoning',
      type: 'mcq',
      stem: 'In a certain code, "COMPUTER" is written as "RFUVQNPC". How will "MEDICINE" be written in the same code?',
      options: ['EOJDJEFM', 'EOJDJEDM', 'MFEJDJOE', 'EOJDJEMF'],
      correctIndex: 0,
      explanation: 'Each letter is replaced by its corresponding letter from the opposite end of the alphabet. C→R, O→L, etc.',
      difficulty: 'hard',
      tags: ['Coding-Decoding'],
      status: 'live'
    },
    {
      examId: 'bank-po',
      section: 'quantitative-aptitude',
      topic: 'Interest',
      type: 'mcq',
      stem: 'A sum of money amounts to Rs. 9800 after 5 years and Rs. 12005 after 8 years at the same rate of simple interest. The rate of interest per annum is:',
      options: ['12%', '13%', '14%', '15%'],
      correctIndex: 1,
      explanation: 'Let the principal be P and rate of interest be R%. According to the given conditions:\nP + (P × R × 5)/100 = 9800\nP + (P × R × 8)/100 = 12005\nSolving these equations: P = 7000 and R = 8%.',
      difficulty: 'medium',
      tags: ['Simple Interest'],
      status: 'live'
    }
  ];
  
  // Combine all questions
  const questions = [...sscQuestions, ...bankQuestions];
  
  // Add questions to Firestore
  const batch = db.batch();
  
  for (const question of questions) {
    const questionRef = db.collection('questions').doc();
    batch.set(questionRef, {
      ...question,
      createdAt: new Date(),
      createdBy: 'system'
    });
  }
  
  await batch.commit();
  logger.info(`Finished seeding ${questions.length} questions`);
}

/**
 * Seed initial user data
 */
async function seedUsers() {
  logger.info('Seeding user data');
  
  const users = [
    {
      displayName: 'Demo User',
      email: 'demo@example.com',
      photoURL: 'https://ui-avatars.com/api/?name=Demo+User',
      targetExam: 'ssc-cgl',
      prefs: {
        theme: 'system',
        language: 'en',
        fontScale: 1
      },
      streak: 5,
      badges: ['first_attempt', 'quick_learner'],
      roles: ['user'],
      createdAt: new Date()
    },
    {
      displayName: 'Admin User',
      email: 'admin@example.com',
      photoURL: 'https://ui-avatars.com/api/?name=Admin+User',
      targetExam: 'bank-po',
      prefs: {
        theme: 'dark',
        language: 'en',
        fontScale: 1
      },
      streak: 12,
      badges: ['admin', 'perfect_score'],
      roles: ['user', 'admin'],
      createdAt: new Date()
    }
  ];
  
  // Add users to Firestore
  const batch = db.batch();
  
  for (const user of users) {
    // Skip if user already exists with this email
    const existingUser = await db.collection('users')
      .where('email', '==', user.email)
      .limit(1)
      .get();
    
    if (!existingUser.empty) {
      logger.info(`User with email ${user.email} already exists, skipping`);
      continue;
    }
    
    const userRef = db.collection('users').doc();
    batch.set(userRef, user);
    logger.info(`Added user: ${user.displayName}`);
  }
  
  await batch.commit();
  logger.info('Finished seeding user data');
}