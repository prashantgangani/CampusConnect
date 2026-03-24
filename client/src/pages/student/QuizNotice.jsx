import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import applicationService from '../../services/applicationService';
import SecureQuiz from '../../components/student/SecureQuiz';
import './QuizNotice.css';

const QuizNotice = () => {
  const navigate = useNavigate();
  const { applicationId } = useParams();

  const [startingQuiz, setStartingQuiz] = useState(false);
  const [secureQuizOpen, setSecureQuizOpen] = useState(false);
  const [secureQuizLoading, setSecureQuizLoading] = useState(false);
  const [secureQuizQuestions, setSecureQuizQuestions] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [quizResult, setQuizResult] = useState(null);

  const notices = useMemo(() => ([
    'Maintain integrity during the quiz. Any malpractice is strictly prohibited.',
    'Do not switch tabs, open other desktop windows, or move away from the quiz screen.',
    'If tab/window/desktop switching is detected, your quiz will be auto submitted immediately.',
    'Do not refresh or close the page during the quiz.',
    'Read each question carefully before selecting your answer.'
  ]), []);

  const handleStartQuiz = async () => {
    if (!applicationId) {
      setMessage({
        text: 'Invalid quiz request. Please go back and try again.',
        type: 'error'
      });
      return;
    }

    try {
      setStartingQuiz(true);
      setMessage({ text: '', type: '' });
      setSecureQuizLoading(true);

      const response = await applicationService.startQuiz(applicationId);
      const rawQuestions = Array.isArray(response?.questions) ? response.questions : [];
      const questions = rawQuestions
        .map((question, index) => ({
          ...question,
          _id: question?._id || question?.id || `q_${index}`,
          options: Array.isArray(question?.options) ? question.options : []
        }))
        .filter((question) => question.question && question.options.length > 0);

      if (!questions.length) {
        setMessage({
          text: 'Quiz questions are not available right now. Please try again in a moment.',
          type: 'error'
        });
        setSecureQuizLoading(false);
        return;
      }

      setSecureQuizQuestions(questions);
      setSecureQuizLoading(false);
      setSecureQuizOpen(true);
    } catch (error) {
      setMessage({
        text: error?.message || 'Unable to start quiz right now. Please try again.',
        type: 'error'
      });
      setSecureQuizLoading(false);
    } finally {
      setStartingQuiz(false);
    }
  };

  const handleCloseQuiz = () => {
    setSecureQuizOpen(false);
    setSecureQuizLoading(false);
    setSecureQuizQuestions([]);
  };

  const handleQuizSubmitSuccess = (result) => {
    setQuizResult(result);
    setSecureQuizOpen(false);
    setSecureQuizLoading(false);
    setSecureQuizQuestions([]);
  };

  return (
    <div className="quiz-notice-page">
      <header className="quiz-notice-header">
        <div className="quiz-notice-brand">
          <span className="quiz-notice-icon">🎓</span>
          <span className="quiz-notice-brand-text">
            <span className="quiz-notice-campus">Campus</span>
            <span className="quiz-notice-connect">Connect</span>
          </span>
        </div>
        <button type="button" className="quiz-notice-back" onClick={() => navigate('/student/dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <main className="quiz-notice-main">
        <div className="quiz-notice-card">
          <h1>Quiz Instructions & Notices</h1>
          <p className="quiz-notice-subtitle">
            Please read all notices before starting your quiz.
          </p>

          {message.text && (
            <div className={`quiz-notice-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <ul className="quiz-notice-list">
            {notices.map((notice) => (
              <li key={notice}>{notice}</li>
            ))}
          </ul>

          <div className="quiz-notice-warning">
            <strong>Important:</strong> If you change tabs or open another desktop/tab during quiz,
            your quiz will be auto submitted.
          </div>

          <div className="quiz-notice-actions">
            <button
              type="button"
              className="quiz-notice-start"
              onClick={handleStartQuiz}
              disabled={startingQuiz}
            >
              {startingQuiz ? 'Starting Quiz...' : 'Start Quiz'}
            </button>
          </div>
        </div>
      </main>

      {quizResult && (
        <main className="quiz-notice-main">
          <div className="quiz-notice-card">
            <h1>Quiz Result</h1>
            <div className={`quiz-result-message ${quizResult.passed ? 'success' : 'failure'}`}>
              <div className="result-icon">
                {quizResult.passed ? '✅' : '❌'}
              </div>
              <div className="result-text">
                <h2>{quizResult.passed ? 'Company Quiz Passed!' : 'Company Quiz Failed'}</h2>
                <p>{quizResult.text}</p>
                <div className="result-details">
                  <span className="score">Score: {quizResult.percentage}%</span>
                </div>
              </div>
            </div>
            <div className="quiz-notice-actions">
              <button
                type="button"
                className="quiz-notice-start"
                onClick={() => navigate('/student/company-quiz-round')}
              >
                Back to Company Quiz Round
              </button>
            </div>
          </div>
        </main>
      )}

      <SecureQuiz
        isOpen={secureQuizOpen}
        applicationId={applicationId}
        questions={secureQuizQuestions}
        loading={secureQuizLoading}
        onClose={handleCloseQuiz}
        onSubmitSuccess={handleQuizSubmitSuccess}
      />
    </div>
  );
};

export default QuizNotice;
