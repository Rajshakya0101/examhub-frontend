# User Stats & Attempt Tracking Structure

## Overview
Each user has their own comprehensive record in Firestore that tracks all their test attempts across different types (Full Mock, Sectional, Topic-wise). This data powers the Dashboard and Leaderboard features.

## Firestore Collections

### 1. `userStats/{userId}` - Main User Statistics Document

```typescript
interface UserStats {
  userId: string;
  
  // Overall Statistics
  totalScore: number;               // Aggregate score across all tests
  testsCompleted: number;           // Total number of tests completed
  questionsAnswered: number;        // Total questions attempted
  correctAnswers: number;           // Total correct answers
  accuracy: number;                 // Overall accuracy percentage (0-100)
  totalTimeSpentSec: number;        // Total time spent on all tests
  
  // Streak & Consistency
  currentStreak: number;            // Current daily streak
  longestStreak: number;            // Longest streak achieved
  lastActivityDate: Timestamp;      // Last activity timestamp
  
  // Test Type Breakdown
  mockTestStats: {
    fullMock: MockTypeStats;        // Full mock test statistics
    sectional: MockTypeStats;       // Sectional mock statistics
    topicWise: MockTypeStats;       // Topic-wise mock statistics
  };
  
  // Subject-wise Performance
  subjectPerformance: {
    [subjectName: string]: SubjectStats;
  };
  
  // Recent Performance
  recentScores: Array<{
    date: Timestamp;
    examId: string;
    score: number;
    percentage: number;
  }>;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface MockTypeStats {
  attempted: number;                // Number of attempts
  completed: number;                // Number completed
  totalQuestions: number;           // Total questions across all attempts
  correctAnswers: number;           // Total correct answers
  incorrectAnswers: number;         // Total incorrect answers
  unanswered: number;               // Total unanswered questions
  averageScore: number;             // Average score percentage
  averageAccuracy: number;          // Average accuracy percentage
  averageTimePerQuestion: number;   // Avg time per question in seconds
  bestScore: number;                // Best score achieved
  totalTimeSpent: number;           // Total time spent in seconds
  lastAttemptDate: Timestamp;       // Last attempt timestamp
}

interface SubjectStats {
  subjectName: string;
  attempted: number;                // Questions attempted in this subject
  correct: number;                  // Correct answers
  incorrect: number;                // Incorrect answers
  accuracy: number;                 // Accuracy percentage
  averageTimePerQuestion: number;   // Average time in seconds
  strongTopics: string[];           // Topics where accuracy > 80%
  weakTopics: string[];             // Topics where accuracy < 60%
}
```

### 2. `attempts/{attemptId}` - Individual Test Attempt

```typescript
interface Attempt {
  id: string;
  userId: string;
  examId: string;
  examTitle: string;
  
  // Test Type Classification
  testType: 'full-mock' | 'sectional' | 'topic-wise' | 'quick-quiz';
  category: string;                 // e.g., 'SSC', 'Banking'
  subject?: string;                 // For sectional/topic-wise
  topic?: string;                   // For topic-wise
  difficulty: 'easy' | 'moderate' | 'hard';
  
  // Attempt Details
  status: 'started' | 'paused' | 'submitted' | 'timed_out';
  startedAt: Timestamp;
  submittedAt?: Timestamp;
  timeSpentSec: number;             // Actual time spent
  timeLimitSec: number;             // Time limit for the test
  
  // Score & Performance
  score: {
    raw: number;                    // Raw score (e.g., 75/100)
    percentage: number;             // Percentage score
    percentile?: number;            // Percentile among other test takers
    passFail?: 'pass' | 'fail';
  };
  
  // Question Statistics
  questionStats: {
    total: number;                  // Total questions
    attempted: number;              // Questions attempted
    correct: number;                // Correct answers
    incorrect: number;              // Incorrect answers
    skipped: number;                // Unanswered/skipped
    markedForReview: number;        // Questions marked for review
  };
  
  // Section-wise Performance (for multi-section tests)
  sectionScores?: {
    [sectionName: string]: {
      raw: number;                  // Score in this section
      total: number;                // Total questions
      attempted: number;            // Attempted in this section
      accuracy: number;             // Section accuracy
    };
  };
  
  // Metadata
  updatedAt: Timestamp;
}
```

### 3. `attempt_items/{attemptId}/items/{questionId}` - Individual Question Answers

```typescript
interface QuestionAttempt {
  id: string;                       // questionId
  attemptId: string;
  
  // Question Details
  questionText: string;
  subject: string;
  topic: string;
  difficulty: string;
  correctIndex: number;
  
  // User Response
  selectedIdx: number | null;       // User's selected answer (null if skipped)
  timeSpentMs: number;              // Time spent on this question
  visited: boolean;                 // Whether user visited this question
  markedForReview: boolean;
  isCorrect: boolean;               // Whether answer was correct
  
  // Timestamps
  firstVisitedAt?: Timestamp;
  answeredAt?: Timestamp;
}
```

### 4. `dailySummaries/{userId}_{date}` - Daily Performance Summary

```typescript
interface DailySummary {
  id: string;                       // Format: userId_YYYY-MM-DD
  userId: string;
  date: string;                     // YYYY-MM-DD
  
  // Daily Stats
  testsCompleted: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  timeSpent: number;                // Total time in seconds
  
  // Test Type Breakdown
  fullMockCount: number;
  sectionalCount: number;
  topicWiseCount: number;
  
  // Best Performance
  bestScore: number;
  bestAccuracy: number;
  
  // Metadata
  createdAt: Timestamp;
}
```

### 5. `weeklySummaries/{userId}_{weekId}` - Weekly Aggregation

```typescript
interface WeeklySummary {
  id: string;                       // Format: userId_YYYY-WW
  userId: string;
  weekStart: string;                // YYYY-MM-DD
  weekEnd: string;                  // YYYY-MM-DD
  
  // Weekly Stats
  testsCompleted: number;
  totalQuestions: number;
  correctAnswers: number;
  averageAccuracy: number;
  totalTimeSpent: number;
  
  // Test Type Distribution
  fullMockCount: number;
  sectionalCount: number;
  topicWiseCount: number;
  
  // Performance Trend
  improvementRate: number;          // Compared to previous week
  consistencyScore: number;         // How consistent was performance
  
  // Strong & Weak Areas
  strongSubjects: string[];
  weakSubjects: string[];
  
  createdAt: Timestamp;
}
```

### 6. `monthlySummaries/{userId}_{monthId}` - Monthly Aggregation

```typescript
interface MonthlySummary {
  id: string;                       // Format: userId_YYYY-MM
  userId: string;
  month: string;                    // YYYY-MM
  
  // Monthly Stats
  testsCompleted: number;
  totalQuestions: number;
  correctAnswers: number;
  averageAccuracy: number;
  totalTimeSpent: number;
  
  // Test Type Distribution
  fullMockCount: number;
  sectionalCount: number;
  topicWiseCount: number;
  
  // Performance Metrics
  improvementRate: number;
  rankChange: number;               // Change in leaderboard rank
  achievementsEarned: number;
  
  // Top Performances
  bestTests: Array<{
    examId: string;
    score: number;
    date: Timestamp;
  }>;
  
  createdAt: Timestamp;
}
```

## Data Flow

### When User Completes a Test:

1. **Update `attempts/{attemptId}`**
   - Set status to 'submitted'
   - Calculate final score and statistics
   - Update questionStats

2. **Update `userStats/{userId}`**
   - Increment testsCompleted
   - Update questionsAnswered, correctAnswers
   - Recalculate accuracy
   - Update mockTestStats based on testType
   - Update subjectPerformance
   - Add to recentScores
   - Update streaks if applicable

3. **Create/Update Daily Summary**
   - Aggregate daily performance
   - Update test type counts

4. **Trigger Cloud Functions** (automated)
   - Weekly summary aggregation (runs weekly)
   - Monthly summary aggregation (runs monthly)
   - Leaderboard recalculation (runs hourly)
   - Achievement checking

## Usage in Dashboard

```typescript
// Fetch comprehensive user stats
const userStats = await getDoc(doc(db, 'userStats', userId));

// Display overall performance
console.log(`Tests Completed: ${userStats.testsCompleted}`);
console.log(`Overall Accuracy: ${userStats.accuracy}%`);
console.log(`Current Streak: ${userStats.currentStreak} days`);

// Display test type breakdown
console.log(`Full Mocks: ${userStats.mockTestStats.fullMock.completed}`);
console.log(`Sectional: ${userStats.mockTestStats.sectional.completed}`);
console.log(`Topic-wise: ${userStats.mockTestStats.topicWise.completed}`);

// Subject-wise performance
Object.entries(userStats.subjectPerformance).forEach(([subject, stats]) => {
  console.log(`${subject}: ${stats.accuracy}% accuracy`);
});
```

## Usage in Leaderboard

```typescript
// Query top users by total score
const topUsers = await getDocs(
  query(
    collection(db, 'userStats'),
    orderBy('totalScore', 'desc'),
    limit(100)
  )
);

// Calculate rank based on scoring formula
// Score = 60% * testsCompleted + 25% * accuracy + 15% * consistency
```

## Cloud Functions Integration

### Automated Jobs:

1. **`dailyStatsAggregation`** (Runs daily at 1:00 AM)
   - Aggregates yesterday's data into dailySummaries
   - Updates weekly and monthly summaries
   - Cleans up old data (>6 months)

2. **`leaderboardRecalculation`** (Runs hourly)
   - Recalculates global/weekly/monthly rankings
   - Updates percentiles
   - Archives old leaderboard data

3. **`achievementChecker`** (Triggered on test completion)
   - Checks if user earned new achievements
   - Updates user badges
   - Awards XP points

## Benefits

✅ **Complete Tracking**: Every test attempt is recorded with full details
✅ **Type-Specific Analytics**: Separate stats for Full Mock, Sectional, Topic-wise
✅ **Subject Mastery**: Track performance by subject and topic
✅ **Historical Data**: Daily, weekly, monthly aggregations
✅ **Leaderboard Ready**: Comprehensive scoring data for rankings
✅ **Achievement System**: Detailed data for triggering achievements
✅ **Performance Insights**: Identify strong/weak areas automatically
