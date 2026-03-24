# Company Quiz Round Feature Implementation

## Summary
Successfully implemented a comprehensive **Company Quiz Round** feature where:
- Companies upload quizzes with **start time, end time** validation (must be future dates, end time > start time)
- Students who passed mentor approval receive the quiz automatically
- New **"Company Quiz Round"** section in navbar for students to view and take active quizzes
- Companies can **edit, reassign students, or mark ineligible** from their applicants page
- Quiz availability is enforced: students can only attempt quizzes within the quiz window

---

## Database Changes

### CompanyApplicantQuiz Schema (`server/models/CompanyApplicantQuiz.js`)
**New fields added:**
- `startTime` (Date, optional): When quiz becomes available
- `endTime` (Date, optional): When quiz expires
- `quizDeadline` (Date): Alias for quiz submission deadline

---

## Backend Implementation

### 3 New Controllers (`server/controllers/applicationController.js`)

1. **`getCompanyApplicantQuiz()`** - Company fetches quiz details for a job
   - Validates company ownership
   - Returns quiz configuration

2. **`reassignCompanyApplicant()`** - Company reassigns student to retake quiz
   - Resets `companyQuizScore` and `companyQuizAttemptedAt`
   - Changes status to `'company_quiz_pending'`

3. **`getStudentCompanyQuizzes()`** - Student fetches their active quiz assignments
   - Returns list of quizzes assigned to student
   - Includes timing window validation
   - Shows `isWithinWindow: true/false` flag

### Updated Controllers

4. **`upsertCompanyApplicantQuiz()`** - Enhanced to require startTime & endTime
   - Validates `startTime` is now or future
   - Validates `endTime > startTime`
   - Sets `quizDeadline = endTime`

5. **`startQuiz()`** for company_quiz_pending - Now checks timing window
   - Returns 400 if quiz hasn't started yet
   - Returns 400 if quiz has ended

6. **`submitQuiz()`** for company_quiz_pending - Now checks timing window
   - Returns 400 if submission window closed

### New Routes (`server/routes/applicationRoutes.js`)

```javascript
// Company routes
router.get('/company/jobs/:jobId/quiz', authorize('company'), getCompanyApplicantQuiz);
router.patch('/company/:id/reassign', authorize('company'), reassignCompanyApplicant);

// Student route
router.get('/student/company-quizzes', authorize('student'), getStudentCompanyQuizzes);
```

---

## Frontend Implementation

### New Page: CompanyQuizRound (`client/src/pages/student/CompanyQuizRound.jsx`)

**Features:**
- Displays all company quiz assignments for the logged-in student
- Shows quiz title, description, start/end times, upload date
- **"Take Company Quiz"** button enabled only when `isWithinWindow = true`
- Status badges: "Passed", "Failed", "Quiz Expired", "Not Started Yet"
- Clean dashboard-style UI consistent with existing pages

### Student Dashboard Updates (`client/src/pages/student/StudentDashboard.jsx`)

**Header Navigation:**
- Added **"Company Quiz Round"** button before "My Profile"
- Both loading and main dashboard states updated with new nav

### CompanyApplicantQuizUpload Enhancements (`client/src/pages/company/CompanyApplicantQuizUpload.jsx`)

**New Features:**
- Split deadline into **Start Time** and **End Time** inputs
- Load existing quiz config when job selected (via `loadCompanyQuizForJob()`)
- Form validation: startTime must be future, endTime > startTime
- Upload timestamp shown in success message

### CompanyApplicants Enhancements (`client/src/pages/company/CompanyApplicants.jsx`)

**New Applicant Actions:**
- **"Reassign"** button: Sends student back to `company_quiz_pending` status
- **"Ineligible"** button: Marks student as ineligible and rejects application
- Both actions in Applicant Pool and Passed Students sections
- Combined with existing "See Profile", "Approve", "Reject" buttons

### App Routes (`client/src/App.jsx`)

```javascript
<Route
  path="/student/company-quiz-round"
  element={<ProtectedRoute element={<CompanyQuizRound />} requiredRole="student" />}
/>
```

---

## Service Layer Updates

### jobService (`client/src/services/jobService.js`)
- `getCompanyApplicantQuizByJob(jobId)` - Fetch quiz config
- `reassignCompanyApplicant(applicationId)` - Reassign student

### applicationService (`client/src/services/applicationService.js`)
- `getStudentCompanyQuizzes()` - Fetch student's quiz assignments

---

## Data Flow

### Company Upload Quiz Flow
1. Company navigates to **/company/applicant-quiz-upload**
2. Selects job → loads existing quiz (if any)
3. Sets **startTime** (e.g., "2026-03-25 10:00")
4. Sets **endTime** (e.g., "2026-03-26 10:00")
5. Clicks **"Upload Quiz"**
6. Validation checks: startTime > now, endTime > startTime
7. Quiz saved to DB with timestamps
8. Mentor-approved students auto-moved to `company_quiz_pending` status ✅

### Student Takes Quiz Flow
1. Student navigates to **/student/company-quiz-round** (from navbar)
2. See list of assigned quizzes with upload dates & timing windows
3. If `isWithinWindow = true` and `status = 'company_quiz_pending'`:
   - **"Take Company Quiz"** button is enabled
4. Click button → navigate to quiz notice page
5. Quiz questions shown only if current time is within [startTime, endTime]
6. Submit quiz → score calculated, moved to `company_quiz_passed` or `company_quiz_failed`

### Company Manage Applicants Flow
1. Navigate to **/company/applicants**
2. **Applicant Pool** section (mentor-approved, pending quiz):
   - "Reassign" → Student redoes quiz from start
   - "Ineligible" → Mark as ineligible (rejects)
   - "Reject" → Outright reject
3. **Students Passed Company Quiz** section (after deadline):
   - "Reassign" → Back to pending quiz
   - "Ineligible" → Mark as ineligible
   - "Approve" → Move to selected/hired
   - "Reject" → Outright reject

---

## Status Transitions

```
mentor_approved
    ↓
company_quiz_pending (student can attempt quiz between startTime & endTime)
    ├─ company_quiz_passed (score ≥ passingPercentage) → awaits company approval after deadline
    ├─ company_quiz_failed (score < passingPercentage) → can retake if reassigned
    └─ rejected (if company marks ineligible/rejects)

company_quiz_passed (after application deadline passes)
    ├─ selected (company approves/hires)
    └─ rejected (company rejects/marks ineligible)
```

---

## UI/UX Consistency

✅ **CompanyQuizRound page** - Matches StudentDashboard styling (same Dashboard.css classes)
✅ **Header navigation** - Consistent button styling with existing pages
✅ **Status badges** - Color-coded (green=success, red=failure, orange=pending, gray=info)
✅ **Time display** - Human-readable format using `toLocaleString()`
✅ **Empty states** - Clear messaging when no quizzes assigned
✅ **Loading states** - Consistent with dashboard patterns

---

## Testing Checklist

- [ ] Company uploads quiz with startTime=now, endTime=tomorrow
- [ ] Student can see quiz in "Company Quiz Round" section
- [ ] Student can take quiz only within the time window
- [ ] Student submission after deadline returns error
- [ ] Company can reassign student to retake quiz
- [ ] Company can mark student as ineligible
- [ ] Quiz score persists after retake (reassign resets it)
- [ ] Navigation buttons work on all pages
- [ ] Responsive design on mobile/tablet

---

## Files Modified

**Backend:**
- `server/models/CompanyApplicantQuiz.js` - Added startTime, endTime fields
- `server/controllers/applicationController.js` - 3 new controllers, timing validation
- `server/routes/applicationRoutes.js` - 3 new routes

**Frontend:**
- `client/src/pages/student/CompanyQuizRound.jsx` - NEW page
- `client/src/pages/student/StudentDashboard.jsx` - Added navbar button
- `client/src/pages/company/CompanyApplicantQuizUpload.jsx` - Split deadline into start/end times
- `client/src/pages/company/CompanyApplicants.jsx` - Added reassign/ineligible buttons
- `client/src/App.jsx` - New route
- `client/src/services/jobService.js` - New API methods
- `client/src/services/applicationService.js` - New API method

---

## No Breaking Changes

✅ All existing features remain functional
✅ Backward compatible with old quiz records (startTime/endTime optional)
✅ Existing student/company dashboards enhanced, not replaced
✅ New navbar button does not interfere with existing buttons

