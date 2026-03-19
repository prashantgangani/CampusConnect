/**
 * SECURE QUIZ - STUDENTDASHBOARD INTEGRATION EXAMPLE
 * ====================================================
 * 
 * This file shows the exact changes needed in StudentDashboard.jsx
 * to integrate the SecureQuiz fullscreen component.
 * 
 * BEFORE: Modal-based quiz
 * AFTER: Fullscreen secure quiz with anti-cheating
 */

// ============================================
// IMPORTS (ADD THESE)
// ============================================
import SecureQuiz from '../../components/student/SecureQuiz';
// Already have:
// import applicationService from '../../services/applicationService';

// ============================================
// STATE CHANGES (REPLACE OLD STATE)
// ============================================

// REMOVE THESE:
// const [quizModalOpen, setQuizModalOpen] = useState(false);
// const [quizLoading, setQuizLoading] = useState(false);
// const [quizSubmitting, setQuizSubmitting] = useState(false);
// const [quizApplicationId, setQuizApplicationId] = useState(null);
// const [quizQuestions, setQuizQuestions] = useState([]);
// const [quizAnswers, setQuizAnswers] = useState({});
// const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);

// ADD THESE:
const [secureQuizOpen, setSecureQuizOpen] = useState(false);
const [secureQuizLoading, setSecureQuizLoading] = useState(false);
const [secureQuizApplicationId, setSecureQuizApplicationId] = useState(null);
const [secureQuizQuestions, setSecureQuizQuestions] = useState([]);

// KEEP THESE (unchanged):
const [quizResultModal, setQuizResultModal] = useState({
  open: false,
  passed: false,
  percentage: 0,
  text: '',
  applicationId: null
});

// ============================================
// FUNCTION CHANGES
// ============================================

// UPDATE THIS FUNCTION:
const handleTakeQuiz = async (applicationId) => {
  try {
    if (!applicationId) {
      setUiMessage({
        type: 'error',
        text: 'Quiz is not available for this application right now. Please refresh and try again.'
      });
      return;
    }

    setUiMessage(null);
    setSecureQuizLoading(true);
    setSecureQuizApplicationId(applicationId);
    setSecureQuizOpen(true);

    // Fetch quiz questions
    const quizStartResponse = await applicationService.startQuiz(applicationId);
    const questions = quizStartResponse.questions || [];

    if (!questions.length) {
      setSecureQuizOpen(false);
      setUiMessage({
        type: 'error',
        text: 'Quiz questions are not available right now. Please try again in a moment.'
      });
      return;
    }

    setSecureQuizQuestions(questions);
  } catch (error) {
    console.error('Error taking quiz:', error);
    setSecureQuizOpen(false);
    setUiMessage({
      type: 'error',
      text: getErrorMessage(error, 'Unable to start quiz right now. Please try again.')
    });
  } finally {
    setSecureQuizLoading(false);
  }
};

// ADD THIS NEW FUNCTION:
const handleSecureQuizClose = () => {
  setSecureQuizOpen(false);
  setSecureQuizLoading(false);
  setSecureQuizQuestions([]);
  setSecureQuizApplicationId(null);
};

// ADD THIS NEW FUNCTION:
const handleSecureQuizSubmitSuccess = (result) => {
  // Show result modal with the submission result
  setQuizResultModal({
    open: true,
    passed: result.passed,
    percentage: result.percentage,
    text: result.text,
    applicationId: secureQuizApplicationId
  });

  // Refresh dashboard to show updated application status
  fetchDashboardData(false);
};

// REMOVE THESE FUNCTIONS (no longer needed):
// const handleSelectQuizAnswer = (questionId, option) => { ... }
// const handleCloseQuizModal = () => { ... }
// const handleSubmitQuiz = async () => { ... }

// KEEP handleQuizResultOk UNCHANGED - it still handles result modal

// ============================================
// JSX CHANGES
// ============================================

// REMOVE THIS old quiz modal JSX:
/*
{quizModalOpen && (
  <div className="quiz-modal-overlay">
    <div className="quiz-modal">
      <div className="quiz-modal-header">
        <h3>Job Screening Quiz</h3>
        <button type="button" className="quiz-close" onClick={handleCloseQuizModal} disabled={quizSubmitting}>
          ×
        </button>
      </div>

      {quizLoading ? (
        <div className="quiz-loading">Loading quiz questions...</div>
      ) : (
        <>
          ... quiz UI ...
        </>
      )}
    </div>
  </div>
)}
*/

// ADD THIS secure quiz component:
<SecureQuiz
  isOpen={secureQuizOpen}
  applicationId={secureQuizApplicationId}
  questions={secureQuizQuestions}
  loading={secureQuizLoading}
  onClose={handleSecureQuizClose}
  onSubmitSuccess={handleSecureQuizSubmitSuccess}
/>

// KEEP THIS result modal unchanged:
{quizResultModal.open && (
  <div className="quiz-result-overlay">
    <div className="quiz-result-modal">
      <div className={`quiz-result-icon ${quizResultModal.passed ? 'result-pass' : 'result-fail'}`}>
        {quizResultModal.passed ? '✅' : '❌'}
      </div>
      <h3 className="quiz-result-title">
        {quizResultModal.passed ? 'Quiz Passed' : 'Quiz Failed'}
      </h3>
      <p className="quiz-result-score">Score: {quizResultModal.percentage}%</p>
      <p className="quiz-result-text">{quizResultModal.text}</p>
      <button type="button" className="quiz-result-ok" onClick={handleQuizResultOk}>
        OK
      </button>
    </div>
  </div>
)}

// ============================================
// COMPLETE UPDATED COMPONENT STRUCTURE
// ============================================

/*
const StudentDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  
  // ... all your existing state ...

  // NEW STATE FOR SECURE QUIZ:
  const [secureQuizOpen, setSecureQuizOpen] = useState(false);
  const [secureQuizLoading, setSecureQuizLoading] = useState(false);
  const [secureQuizApplicationId, setSecureQuizApplicationId] = useState(null);
  const [secureQuizQuestions, setSecureQuizQuestions] = useState([]);

  // ... all your existing functions ...
  
  // UPDATED FUNCTION:
  // const handleTakeQuiz = async (applicationId) => { ... }
  
  // NEW FUNCTIONS:
  // const handleSecureQuizClose = () => { ... }
  // const handleSecureQuizSubmitSuccess = (result) => { ... }

  return (
    <div className="student-dashboard">
      {/* All your existing dashboard UI */}
      
      {/* NEW: Secure Quiz Component */}
      <SecureQuiz
        isOpen={secureQuizOpen}
        applicationId={secureQuizApplicationId}
        questions={secureQuizQuestions}
        loading={secureQuizLoading}
        onClose={handleSecureQuizClose}
        onSubmitSuccess={handleSecureQuizSubmitSuccess}
      />
      
      {/* EXISTING: Quiz Result Modal (unchanged) */}
      {quizResultModal.open && (
        // ... result modal JSX ...
      )}
      
      {/* All your other dashboard content ... */}
    </div>
  );
};
*/

// ============================================
// STEP-BY-STEP MIGRATION GUIDE
// ============================================

/*
1. BACKUP YOUR FILE:
   cp client/src/pages/student/StudentDashboard.jsx StudentDashboard.jsx.backup

2. ADD IMPORT AT TOP:
   import SecureQuiz from '../../components/student/SecureQuiz';

3. FIND AND REMOVE OLD QUIZ STATE:
   - Search for: const [quizModalOpen
   - Search for: const [quizLoading
   - Search for: const [quizSubmitting
   - Search for: const [quizApplicationId
   - Search for: const [quizQuestions
   - Search for: const [quizAnswers
   - Search for: const [quizCurrentIndex
   
   Remove ALL 7 of these useState declarations

4. ADD NEW QUIZ STATE:
   const [secureQuizOpen, setSecureQuizOpen] = useState(false);
   const [secureQuizLoading, setSecureQuizLoading] = useState(false);
   const [secureQuizApplicationId, setSecureQuizApplicationId] = useState(null);
   const [secureQuizQuestions, setSecureQuizQuestions] = useState([]);

5. FIND AND REPLACE handleTakeQuiz():
   - Copy the new handleTakeQuiz() from above
   - Replace the old one completely
   - Make sure state names match (secureQuiz*)

6. REMOVE OLD FUNCTIONS:
   - handleSelectQuizAnswer
   - handleCloseQuizModal
   - handleSubmitQuiz
   (Keep all others)

7. ADD NEW FUNCTIONS:
   - handleSecureQuizClose
   - handleSecureQuizSubmitSuccess

8. FIND OLD QUIZ MODAL JSX:
   - Search for: {quizModalOpen &&
   - Delete the entire quiz modal block
   - This includes all nested JSX until the closing }

9. ADD NEW SECURE QUIZ COMPONENT:
   <SecureQuiz
     isOpen={secureQuizOpen}
     applicationId={secureQuizApplicationId}
     questions={secureQuizQuestions}
     loading={secureQuizLoading}
     onClose={handleSecureQuizClose}
     onSubmitSuccess={handleSecureQuizSubmitSuccess}
   />

10. VERIFY:
    - Keep quizResultModal state UNCHANGED
    - Keep quizResultModal JSX UNCHANGED
    - Keep handleQuizResultOk() UNCHANGED
    - All other functions should remain unchanged

11. TEST:
    npm run dev
    - Log in as student
    - Find application with quiz_pending status
    - Click "Take Quiz"
    - Verify fullscreen opens
    - Test pressing ESC (warning modal appears)
    - Answer all questions and submit
    - Verify result modal shows

12. VERIFY ANTI-CHEAT FEATURES:
    - Try Ctrl+C → Should be blocked
    - Try right-click → Should be blocked
    - Try F12 → Should be blocked
    - Switch tabs → Should auto-submit
    - Try Alt+Tab → Should auto-submit
*/

// ============================================
// COMMON MISTAKES TO AVOID
// ============================================

/*
❌ WRONG: Removing the wrong quiz state
   Keep: quizResultModal (it's for showing results, not the quiz itself)
   
✅ RIGHT: Only remove quiz modal-related state
   Remove: quizModalOpen, quizLoading, quizSubmitting, quizApplicationId, 
           quizQuestions, quizAnswers, quizCurrentIndex

❌ WRONG: Not updating the onClick handler
   If you're calling handleTakeQuiz(applicationId) → It will still work!
   The function already handles everything

✅ RIGHT: Just update the function internals, not the call sites

❌ WRONG: Mixing old and new state names
   Don't do: setQuizModalOpen(true) and setSecureQuizOpen(true)
   Choose ONE: Use secureQuiz* everywhere

✅ RIGHT: Replace all quiz state handling with secure version

❌ WRONG: Forgetting to import SecureQuiz
   This will cause "SecureQuiz is not defined" error
   
✅ RIGHT: Add import at very top of file

❌ WRONG: Keeping the old quiz modal JSX
   It will cause conflicts and memory leaks
   
✅ RIGHT: Completely remove the old modal JSX block
*/

// ============================================
// TESTING CHECKLIST
// ============================================

/*
✅ Basic Functionality:
   [ ] Quiz opens when "Take Quiz" clicked
   [ ] Questions load
   [ ] Can select options
   [ ] Can navigate (Next/Previous)
   [ ] Can submit when all answered
   [ ] Result modal shows
   [ ] Dashboard refreshes with new status

✅ Fullscreen Features:
   [ ] Fullscreen activated automatically
   [ ] No navbar/sidebar visible
   [ ] Fullscreen exits on submit
   [ ] Fullscreen exits on warning close

✅ Anti-Cheat (First Warning):
   [ ] ESC key → Warning modal appears
   [ ] Warning has correct message
   [ ] "Understood" button re-enters fullscreen
   [ ] Can close warning and continue quiz

✅ Anti-Cheat (Auto Submit):
   [ ] ESC again → Quiz auto-submits
   [ ] Tab switch → Quiz auto-submits
   [ ] Alt+Tab → Quiz auto-submits
   [ ] Minimize → Quiz auto-submits
   [ ] Result modal shows auto-submitted answers

✅ Edge Cases:
   [ ] Browser blocks fullscreen → Quiz still works
   [ ] Network error → Shows error message
   [ ] Empty questions → Shows error
   [ ] Close browser mid-quiz → Session ends
   [ ] Multiple quiz attempts → Each starts fresh

✅ Mobile (if applicable):
   [ ] Layout responsive
   [ ] Touch gestures work
   [ ] Fullscreen may not work (expected)
   [ ] Quiz still functions without fullscreen
*/

// ============================================
// TROUBLESHOOTING
// ============================================

/*
ISSUE: "SecureQuiz is not defined"
FIX: Add import at top: import SecureQuiz from '../../components/student/SecureQuiz';

ISSUE: Fullscreen doesn't work
FIX: This is OK! Quiz still works. Check browser fullscreen permissions.

ISSUE: Quiz doesn't submit when ESC pressed second time
FIX: Check console for errors. Verify applicationId is passed correctly.

ISSUE: Old quiz modal still shows
FIX: Remove the old JSX block completely (search for quizModalOpen)

ISSUE: Can't answer questions after first warning
FIX: Add missing divs/containers. Check CSS is loaded.

ISSUE: State seems wrong after submit
FIX: Verify handleSecureQuizSubmitSuccess is called and refreshes data.
*/
