/**
 * SECURE QUIZ INTEGRATION GUIDE
 * =============================
 * 
 * This guide shows how to integrate the SecureQuiz fullscreen component
 * into your StudentDashboard with anti-cheating features.
 */

// ============================================
// STEP 1: IMPORT THE COMPONENT
// ============================================
// Add this to the top of StudentDashboard.jsx:

import SecureQuiz from '../../components/student/SecureQuiz';

// ============================================
// STEP 2: REPLACE THE QUIZ STATE
// ============================================
// Change your existing quiz-related state from:

// OLD (MODAL-BASED):
// const [quizModalOpen, setQuizModalOpen] = useState(false);
// const [quizLoading, setQuizLoading] = useState(false);
// const [quizSubmitting, setQuizSubmitting] = useState(false);
// const [quizApplicationId, setQuizApplicationId] = useState(null);
// const [quizQuestions, setQuizQuestions] = useState([]);
// const [quizAnswers, setQuizAnswers] = useState({});
// const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);

// NEW (FULLSCREEN SECURE):
const [secureQuizOpen, setSecureQuizOpen] = useState(false);
const [secureQuizLoading, setSecureQuizLoading] = useState(false);
const [secureQuizApplicationId, setSecureQuizApplicationId] = useState(null);
const [secureQuizQuestions, setSecureQuizQuestions] = useState([]);

// ============================================
// STEP 3: UPDATE THE handleTakeQuiz FUNCTION
// ============================================
// Replace your handleTakeQuiz with:

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

// ============================================
// STEP 4: ADD QUIZ SUCCESS HANDLER
// ============================================
// Add this new function to handle quiz submission:

const handleSecureQuizSubmitSuccess = (result) => {
  // Show result modal
  setQuizResultModal({
    open: true,
    passed: result.passed,
    percentage: result.percentage,
    text: result.text,
    applicationId: secureQuizApplicationId
  });

  // Refresh dashboard
  fetchDashboardData(false);
};

// ============================================
// STEP 5: ADD QUIZ CLOSE HANDLER
// ============================================
// Add this function to handle quiz close:

const handleSecureQuizClose = () => {
  setSecureQuizOpen(false);
  setSecureQuizLoading(false);
  setSecureQuizQuestions([]);
  setSecureQuizApplicationId(null);
};

// ============================================
// STEP 6: REPLACE THE QUIZ MODAL JSX
// ============================================
// Remove your old quiz modal JSX:
// {quizModalOpen && (
//   <div className="quiz-modal-overlay">
//     ...
//   </div>
// )}

// And replace with:

<SecureQuiz
  isOpen={secureQuizOpen}
  applicationId={secureQuizApplicationId}
  questions={secureQuizQuestions}
  loading={secureQuizLoading}
  onClose={handleSecureQuizClose}
  onSubmitSuccess={handleSecureQuizSubmitSuccess}
/>

// ============================================
// STEP 7: KEEP YOUR EXISTING RESULT MODAL
// ============================================
// Your existing quizResultModal code should continue to work:

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
// ANTI-CHEATING FEATURES INCLUDED
// ============================================
// The SecureQuiz component automatically includes:
//
// ✅ Fullscreen Mode:
//    - Opens fullscreen automatically
//    - Only quiz content visible
//    - No navbar, sidebar, or background UI
//
// ✅ Keyboard Protection:
//    - Blocks Ctrl+C (copy)
//    - Blocks Ctrl+V (paste)
//    - Blocks Ctrl+X (cut)
//    - Blocks Ctrl+U (view source)
//    - Blocks Ctrl+I / Ctrl+J (inspect)
//    - Blocks F12 (developer tools)
//
// ✅ Context Menu Protection:
//    - Right-click disabled
//    - Text selection disabled
//
// ✅ Fullscreen Exit Detection:
//    - ESC key: Shows warning first time
//    - ESC key second time: Auto-submits quiz
//
// ✅ Tab Switching Detection:
//    - Minimizing/Alt+Tab: Auto-submits quiz
//    - Tab switching: Auto-submits quiz
//    - Window blur: Auto-submits quiz
//
// ✅ Auto-Submit Logic:
//    - Submits with current answers
//    - Stops timer
//    - Locks UI
//    - Exits fullscreen safely
//    - Shows result modal
//
// ============================================
// CLEANUP & BEST PRACTICES
// ============================================
// 
// 1. The component handles all event listeners internally
// 2. Listeners are cleaned up automatically on unmount
// 3. No manual cleanup needed in StudentDashboard
// 4. The component prevents common cheating methods
// 5. All anti-cheat features work without blocking normal quiz interaction

// ============================================
// PRODUCTION CHECKLIST
// ============================================
// 
// ✓ Component is production-ready
// ✓ No infinite loops or memory leaks
// ✓ Smooth animations and transitions
// ✓ Responsive design (mobile-friendly)
// ✓ Proper error handling
// ✓ Clean event listener cleanup
// ✓ Accessibility considerations
// ✓ Cross-browser fullscreen support
// ✓ Mac and Windows keyboard support
// ✓ Safe iframe and alternative browser testing

// ============================================
// OPTIONAL: CUSTOMIZE ANTI-CHEAT RULES
// ============================================
// If you want to modify anti-cheat behavior (NOT RECOMMENDED):
// 
// - Fullscreen auto-entry: Remove enterFullscreen() call
// - Warning modal: Modify handleFullscreenChange() logic
// - Tab switching auto-submit: Remove handleVisibilityChange
// - Keyboard blocking: Modify blockedCombos in handleKeyDown
//
// However, disabling these features defeats the purpose of "secure quiz"!
