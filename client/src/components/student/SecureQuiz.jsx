import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import applicationService from '../../services/applicationService';
import './SecureQuiz.css';

const SecureQuiz = ({
  isOpen,
  applicationId,
  questions = [],
  onClose,
  onSubmitSuccess,
  loading = false
}) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fullscreenRef = useRef(null);
  const listenersAddedRef = useRef(false);
  const lastViolationTimeRef = useRef({});
  const autoSubmitInProgressRef = useRef(false);
  const DEBOUNCE_TIME = 500; // Prevent multiple violations within 500ms

  // Helper function to check if event should be debounced
  const shouldProcessViolation = useCallback((violationType) => {
    const now = Date.now();
    const lastTime = lastViolationTimeRef.current[violationType] || 0;
    
    if (now - lastTime < DEBOUNCE_TIME) {
      console.log(`⏸️ Debounced: ${violationType} (${DEBOUNCE_TIME}ms)`);
      return false;
    }
    
    lastViolationTimeRef.current[violationType] = now;
    return true;
  }, []);

  // Helper function to trigger warning or auto-submit
  const triggerViolation = useCallback((violationType, violationMessage) => {
    if (!shouldProcessViolation(violationType)) {
      return;
    }

    setViolationCount((prev) => {
      const newCount = prev + 1;
      console.log(`🚨 ${violationType}: Violation ${newCount}`);
      
      if (newCount < 3) {
        // First or second violation: Show warning
        setWarningMessage(
          `⚠️ ${violationMessage}\\n\\nWarning ${newCount}/2\\n\\nYou have ${3 - newCount} more attempt(s) remaining.`
        );
        setShowWarningModal(true);
      } else if (newCount === 3) {
        // Third violation: Auto-submit immediately
        console.log(`🚫 ${violationType}: Third violation reached - AUTO-SUBMITTING`);
        setShowWarningModal(false);
        setIsSubmitted(true);
      }
      
      return newCount;
    });
  }, [shouldProcessViolation]);

  // Helper function to check if fullscreen is currently active
  const isFullscreenCurrently = useCallback(() => {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }, []);

  // Anti-cheat: Handle key presses
  const handleKeyDown = useCallback((e) => {
    const isMacLike = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
    const ctrlKey = isMacLike ? e.metaKey : e.ctrlKey;

    // Handle ESC key
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔴 ESC key pressed');
      triggerViolation('ESC_PRESS', 'ESC Key Pressed');
      return;
    }

    // Block dangerous keyboard shortcuts
    const blockedCombos = [
      { key: 'c', ctrl: true },      // Ctrl+C
      { key: 'v', ctrl: true },      // Ctrl+V
      { key: 'x', ctrl: true },      // Ctrl+X
      { key: 'u', ctrl: true },      // Ctrl+U
      { key: 'i', ctrl: true, shift: true }, // Ctrl+Shift+I
      { key: 'c', ctrl: true, shift: true }, // Ctrl+Shift+C
      { key: 'j', ctrl: true, shift: true }, // Ctrl+Shift+J
      { key: 'k', ctrl: true, shift: true }, // Ctrl+Shift+K
      { key: 'F12' }                 // F12
    ];

    const isBlocked = blockedCombos.some((combo) => {
      if (combo.key === 'F12') return e.key === 'F12';
      return (
        e.key.toLowerCase() === combo.key.toLowerCase() &&
        ctrlKey === !!combo.ctrl &&
        e.shiftKey === !!combo.shift
      );
    });

    if (isBlocked) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [triggerViolation]);

  // Anti-cheat: Disable right-click context menu
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, []);

  // Anti-cheat: Disable text selection
  const handleSelectStart = useCallback((e) => {
    e.preventDefault();
    return false;
  }, []);

  // Anti-cheat: Detect tab/app switch
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      console.log('🔴 Tab visibility change detected');
      triggerViolation('TAB_SWITCH', 'Tab Switch Detected - You switched away from quiz');
    } else {
      console.log('✅ Tab visibility restored');
    }
  }, [triggerViolation]);

  // Anti-cheat: Detect window blur (Alt+Tab or app switch)
  const handleWindowBlur = useCallback(() => {
    console.log('🔴 Window blur detected (Alt+Tab or app switch)');
    triggerViolation('WINDOW_BLUR', 'Window Minimum Event - You switched windows');
  }, [triggerViolation]);

  // Anti-cheat: Detect fullscreen exit
  const handleFullscreenChange = useCallback(() => {
    const nowFullscreen = isFullscreenCurrently();
    setIsFullscreenActive(nowFullscreen);

    if (!nowFullscreen) {
      console.log('🔴 Fullscreen exited');
      triggerViolation('FULLSCREEN_EXIT', 'Fullscreen Mode Exited');
    }
  }, [isFullscreenCurrently, triggerViolation]);

  // Auto-submit quiz (with partial answers allowed)
  const handleAutoSubmit = useCallback(async () => {
    // Prevent double auto-submit
    if (autoSubmitInProgressRef.current) {
      console.log('⏸️ Auto-submit already in progress');
      return;
    }
    
    if (!isSubmitted || !applicationId) return;
    
    autoSubmitInProgressRef.current = true;

    try {
      setSubmitting(true);

      // Submit with answered questions only (partial submission allowed 0-10 answers)
      const answersPayload = questions
        .filter((q) => answers[q._id])
        .map((question) => ({
          questionId: question._id,
          selectedAnswer: answers[question._id]
        }));

      console.log('📤 Auto-submitting - applicationId:', applicationId);
      console.log('📤 Auto-submit payload:', JSON.stringify(answersPayload));
      console.log('📤 Total questions:', questions.length, 'answered:', answersPayload.length);

      const submitResponse = await applicationService.submitApplicationQuiz(
        applicationId,
        answersPayload
      );

      // Exit fullscreen safely
      if (isFullscreenCurrently()) {
        try {
          await document.exitFullscreen();
        } catch (err) {
          console.warn('Could not exit fullscreen:', err);
        }
      }

      // Close quiz modal
      setShowWarningModal(false);

      // Notify parent of success
      if (onSubmitSuccess) {
        onSubmitSuccess({
          passed: submitResponse.passed,
          percentage: submitResponse.percentage,
          text: submitResponse.passed
            ? `Quiz auto-submitted! You scored ${submitResponse.percentage}%. Your application is sent to mentor for verification.`
            : `Quiz auto-submitted. You scored ${submitResponse.percentage}%. You did not reach the passing score.`
        });
      }

      // Close quiz component after brief delay, then navigate to home
      if (onClose) {
        setTimeout(() => {
          onClose();
          // Navigate to student dashboard
          navigate('/student/dashboard', { replace: true });
        }, 800);
      } else {
        // If no onClose handler, just navigate to dashboard
        setTimeout(() => {
          navigate('/student/dashboard', { replace: true });
        }, 800);
      }
    } catch (error) {
      console.error('❌ Error auto-submitting quiz:', error);
      const errorMsg = error?.message || (typeof error === 'string' ? error : 'Failed to submit quiz');
      console.error('Error details:', JSON.stringify(error));
      // Don't show alert on auto-submit - just log
      setSubmitting(false);
    }
  }, [applicationId, questions, answers, isFullscreenCurrently, onSubmitSuccess, onClose, navigate, isSubmitted]);

  // Enter fullscreen on quiz start
  const enterFullscreen = useCallback(async () => {
    try {
      if (fullscreenRef.current) {
        if (fullscreenRef.current.requestFullscreen) {
          await fullscreenRef.current.requestFullscreen();
        } else if (fullscreenRef.current.mozRequestFullScreen) {
          await fullscreenRef.current.mozRequestFullScreen();
        } else if (fullscreenRef.current.webkitRequestFullscreen) {
          await fullscreenRef.current.webkitRequestFullscreen();
        } else if (fullscreenRef.current.msRequestFullscreen) {
          await fullscreenRef.current.msRequestFullscreen();
        }
      }
    } catch (err) {
      console.warn('Could not request fullscreen:', err);
    }
  }, []);

  // Handle page refresh / close / unload (beforeunload event)
  // This triggers auto-submit instantly WITHOUT warning
  useEffect(() => {
    if (!isOpen) return;

    const handleBeforeUnload = (e) => {
      if (!autoSubmitInProgressRef.current && !isSubmitted) {
        console.log('🔴 Page refresh/close/unload detected - AUTO-SUBMIT without warning');
        e.preventDefault();
        e.returnValue = '';
        
        // Trigger immediate auto-submit
        autoSubmitInProgressRef.current = true;
        setIsSubmitted(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isOpen, isSubmitted]);

  // Setup event listeners on quiz start
  useEffect(() => {
    if (!isOpen || !questions.length || listenersAddedRef.current) return;

    listenersAddedRef.current = true;
    setCurrentIndex(0);
    setAnswers({});
    setViolationCount(0);
    setIsSubmitted(false);
    setShowWarningModal(false);
    autoSubmitInProgressRef.current = false;
    lastViolationTimeRef.current = {};

    // Enter fullscreen
    enterFullscreen();

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('contextmenu', handleContextMenu, { capture: true });
    document.addEventListener('selectstart', handleSelectStart, { capture: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    console.log('✅ Anti-cheat system initialized - All listeners active');

    return () => {
      // Cleanup event listeners
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('selectstart', handleSelectStart, { capture: true });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);

      listenersAddedRef.current = false;

      // Exit fullscreen on cleanup
      if (isFullscreenCurrently()) {
        try {
          document.exitFullscreen().catch(() => {});
        } catch (err) {
          console.warn('Could not exit fullscreen:', err);
        }
      }
    };
  }, [
    isOpen,
    questions,
    handleKeyDown,
    handleContextMenu,
    handleSelectStart,
    handleVisibilityChange,
    handleWindowBlur,
    handleFullscreenChange,
    enterFullscreen,
    isFullscreenCurrently
  ]);

  // Auto-submit when isSubmitted flag is set to true
  useEffect(() => {
    if (isSubmitted && !submitting) {
      console.log('isSubmitted is true, calling handleAutoSubmit');
      handleAutoSubmit();
    }
  }, [isSubmitted, submitting, handleAutoSubmit]);

  // Auto-submit when violation count reaches 3
  useEffect(() => {
    if (violationCount >= 3 && !isSubmitted) {
      console.log('🚫 Third violation reached - Triggering auto-submit');
      setIsSubmitted(true);
    }
  }, [violationCount, isSubmitted]);

  const handleSelectAnswer = (questionId, option) => {
    if (!submitting) {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: option
      }));
    }
  };

  const handleSubmitQuiz = async () => {
    if (!questions.length || !applicationId) return;

    setIsSubmitted(true);

    try {
      setSubmitting(true);

      // Allow partial submission - submit whatever answers exist (0-10)
      const answersPayload = questions
        .filter((q) => answers[q._id])
        .map((question) => ({
          questionId: question._id,
          selectedAnswer: answers[question._id]
        }));

      console.log('📤 Manual submit - applicationId:', applicationId);
      console.log('📤 Total questions:', questions.length, 'answered:', answersPayload.length);
      console.log('📤 Sending payload:', JSON.stringify(answersPayload));

      const submitResponse = await applicationService.submitApplicationQuiz(
        applicationId,
        answersPayload
      );

      console.log('✅ Submit response:', submitResponse);

      // Exit fullscreen safely
      if (isFullscreenCurrently()) {
        try {
          await document.exitFullscreen();
        } catch (err) {
          console.warn('Could not exit fullscreen:', err);
        }
      }

      if (onSubmitSuccess) {
        onSubmitSuccess({
          passed: submitResponse.passed,
          percentage: submitResponse.percentage,
          text: submitResponse.passed
            ? `Quiz completed successfully! You scored ${submitResponse.percentage}%. Your application is sent to mentor for verification.`
            : `Quiz completed. You scored ${submitResponse.percentage}%. You did not reach the passing score.`
        });
      }

      if (onClose) {
        setTimeout(() => {
          onClose();
          // Navigate to student dashboard
          navigate('/student/dashboard', { replace: true });
        }, 500);
      } else {
        setTimeout(() => {
          navigate('/student/dashboard', { replace: true });
        }, 500);
      }
    } catch (error) {
      console.error('❌ Error submitting quiz:', error);
      const errorMsg = error?.message || error?.msg || (typeof error === 'string' ? error : 'Failed to submit quiz');
      const fullError = typeof error === 'object' ? JSON.stringify(error) : error;
      console.error('Full error details:', fullError);
      alert(`Error: ${errorMsg}\n\nPlease try again or refresh the page.`);
      setIsSubmitted(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWarningOk = () => {
    setShowWarningModal(false);
    // Try to re-enter fullscreen if exited
    if (!isFullscreenActive) {
      enterFullscreen();
    }
  };

  if (!isOpen || !questions.length) return null;

  const currentQuestion = questions[currentIndex];

  return (
    <>
      <div className="secure-quiz-fullscreen" ref={fullscreenRef}>
        {/* Warning Modal */}
        {showWarningModal && (
          <div className="secure-quiz-warning-overlay">
            <div className="secure-quiz-warning-modal">
              <div className="secure-quiz-warning-icon">⚠️</div>
              <h3>Anti-Cheat Warning</h3>
              <p style={{ whiteSpace: 'pre-line' }}>
                {warningMessage}
              </p>
              <button
                type="button"
                className="secure-quiz-warning-ok"
                onClick={handleWarningOk}
              >
                Understood
              </button>
            </div>
          </div>
        )}

        {/* Quiz Content */}
        <div className="secure-quiz-container">
          {loading ? (
            <div className="secure-quiz-loading">Loading quiz questions...</div>
          ) : (
            <>
              {/* Header */}
              <div className="secure-quiz-header">
                <div className="secure-quiz-title-section">
                  <h2>Job Screening Quiz</h2>
                  <p className="secure-quiz-security-badge">🔒 Secure Assessment</p>
                </div>
                <div className="secure-quiz-progress-info">
                  <span className="progress-text">
                    Question {currentIndex + 1} / {questions.length}
                  </span>
                  <span className="progress-text">
                    {Object.keys(answers).length} / {questions.length} answered
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="secure-quiz-progress-bar">
                <div
                  className="secure-quiz-progress-fill"
                  style={{
                    width: `${((currentIndex + 1) / questions.length) * 100}%`
                  }}
                />
              </div>

              {/* Question Block */}
              {currentQuestion && (
                <div className="secure-quiz-content">
                  <div className="secure-quiz-question-block">
                    <p className="secure-quiz-question-text">
                      {currentQuestion.question}
                    </p>

                    <div className="secure-quiz-options">
                      {currentQuestion.options.map((option, idx) => {
                        const questionId = currentQuestion._id;
                        const isSelected = answers[questionId] === option;

                        return (
                          <button
                            key={`${questionId}-${idx}`}
                            type="button"
                            className={`secure-quiz-option ${
                              isSelected ? 'secure-quiz-option-selected' : ''
                            }`}
                            onClick={() => handleSelectAnswer(questionId, option)}
                            disabled={submitting}
                          >
                            <span className="secure-quiz-option-letter">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="secure-quiz-option-text">{option}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="secure-quiz-footer">
                <button
                  type="button"
                  className="secure-quiz-nav-btn"
                  onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={currentIndex === 0 || submitting}
                >
                  ← Previous
                </button>

                <div className="secure-quiz-question-counter">
                  {currentIndex + 1} of {questions.length}
                </div>

                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    className="secure-quiz-nav-btn secure-quiz-nav-primary"
                    onClick={() =>
                      setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))
                    }
                    disabled={submitting}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="secure-quiz-submit-btn"
                    onClick={handleSubmitQuiz}
                    disabled={submitting}
                  >
                    {submitting ? '⏳ Submitting...' : '✓ Submit Quiz'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SecureQuiz;
