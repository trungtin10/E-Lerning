import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'elearning_lang';

const translations = {
  vi: {
    // Header
    courses: 'Khóa học',
    help: 'Trợ giúp',
    langVi: 'Tiếng Việt',
    langEn: 'English',
    student: 'Học viên',
    logout: 'Đăng xuất',
    // Sidebar
    dashboard: 'Bảng điều khiển',
    myCourses: 'Khóa học của tôi',
    certificates: 'Chứng chỉ',
    accountSettings: 'Cài đặt tài khoản',
    // Dashboard
    myCoursesTitle: 'Khóa học của tôi',
    myCoursesDesc: 'Tiếp tục học tập và theo dõi tiến độ của bạn',
    filterAll: 'Tất cả',
    filterInProgress: 'Đang học',
    filterCompleted: 'Đã hoàn thành',
    clearFilter: 'Xóa lọc',
    continueLearning: 'Tiếp tục học',
    viewCourse: 'Xem khóa học',
    noCourses: 'Bạn chưa đăng ký khóa học nào',
    noCoursesHint: 'Khám phá và đăng ký khóa học để bắt đầu học tập',
    endDate: 'Kết thúc',
    noDeadline: 'Không thời hạn',
    // LearningView / CourseOverview - UI labels only
    tabContent: 'Nội dung',
    tabProgress: 'Tiến độ',
    tabDates: 'Ngày quan trọng',
    tabDiscussion: 'Thảo luận',
    tabNotes: 'Ghi chú',
    progressTitle: 'Tiến độ học tập',
    completedPercent: 'đã hoàn thành',
    lessonCount: 'Bài học',
    lessonsCompleted: 'Bài đã hoàn thành',
    contentParts: 'Phần nội dung',
    courseOverview: 'Tổng quan khóa học',
    startLearning: 'Bắt đầu học',
    selectLesson: 'Chọn bài học từ mục lục bên trái',
    video: 'Video',
    quiz: 'Bài tập trắc nghiệm',
    backToContent: 'Quay lại nội dung',
    next: 'Tiếp theo',
    prev: 'Trước',
    bookmark: 'Đánh dấu trang này',
    lessonObjectives: 'Mục tiêu bài học',
    lessonContent: 'Nội dung bài học',
    videoLecture: 'Video bài giảng',
    videoWatched: 'Đã xem xong video',
    watched: 'Đã xem',
    importantDates: 'Ngày quan trọng',
    startDate: 'Ngày khai giảng',
    discussionDev: 'Chức năng thảo luận đang được phát triển.',
    notesDev: 'Chức năng ghi chú đang được phát triển.',
    preparingContent: 'Đang chuẩn bị nội dung học tập...',
    tabCourse: 'Khóa Học',
    mainLessons: 'Bài học chính',
    curriculumContent: 'Nội dung chương trình học',
    expandAll: 'Mở rộng tất cả',
    collapseAll: 'Thu gọn tất cả',
    continueWhereLeft: 'Tiếp tục nơi bạn đã dừng lại',
    continueCourse: 'Tiếp tục khóa học',
    lesson: 'Bài',
    introVideo: 'Video giới thiệu khóa học',
    introVideoShort: 'Video giới thiệu',
    retry: 'Làm lại',
    sectionIntro: 'Giới thiệu học phần',
    welcomeCourse: 'Chào mừng bạn đến với khóa học! Hãy xem tổng quan nội dung bên dưới.',
    // CourseList
    backToDashboard: 'Quay lại Dashboard',
    exploreCourses: 'Khám phá khóa học',
    exploreCoursesDesc: 'Chọn khóa học phù hợp và bắt đầu học ngay.',
    searchPlaceholder: 'Tìm theo tên, mã hoặc danh mục...',
    noCoursesFound: 'Không tìm thấy khóa học nào',
    noCoursesFoundHint: 'Thử thay đổi từ khóa tìm kiếm hoặc quay lại sau.',
    code: 'Mã',
    viewDetails: 'Xem chi tiết',
    // CourseOverview - more
    courseIntro: 'Giới thiệu khóa học',
    noLessonsYet: 'Chưa có bài học nào. Nội dung sẽ được cập nhật khi giảng viên thêm bài học.',
    noContentYet: 'Chưa có phần nội dung',
    featureDev: 'Chức năng đang được phát triển.',
    enterCourse: 'Vào khoá học',
    enrollCourse: 'Đăng ký học',
    youWillGet: 'Bạn sẽ nhận được',
    benefitVideos: 'Video bài giảng & tài liệu đầy đủ',
    benefitQuiz: 'Bài tập trắc nghiệm & tự luận',
    benefitCert: 'Chứng chỉ điện tử khi hoàn thành',
    // Quiz
    quizPassed: 'Chúc mừng! Bạn đã đạt.',
    quizFailed: 'Rất tiếc! Bạn cần cố gắng hơn.',
    correctCount: 'Số câu đúng',
    submitQuiz: 'Nộp bài',
    categoryDefault: 'Chuyên ngành',
    noDescription: 'Chưa có mô tả cho khóa học này.',
    contactTitle: 'TRUNG TÂM DẠY HỌC SỐ - E-LEARNING',
    downloadApp: 'Tải App',
    connect: 'Kết nối',
    termsPolicy: 'Điều khoản và Chính sách',
    termsOfUse: 'Điều khoản sử dụng',
    privacyPolicy: 'Chính sách bảo mật',
    copyright: 'Bảo lưu mọi quyền.',
  },
  en: {
    courses: 'Courses',
    help: 'Help',
    langVi: 'Tiếng Việt',
    langEn: 'English',
    student: 'Student',
    logout: 'Log out',
    dashboard: 'Dashboard',
    myCourses: 'My Courses',
    certificates: 'Certificates',
    accountSettings: 'Account Settings',
    myCoursesTitle: 'My Courses',
    myCoursesDesc: 'Continue learning and track your progress',
    filterAll: 'All',
    filterInProgress: 'In Progress',
    filterCompleted: 'Completed',
    clearFilter: 'Clear filter',
    continueLearning: 'Continue',
    viewCourse: 'View Course',
    noCourses: "You haven't enrolled in any courses",
    noCoursesHint: 'Explore and enroll in courses to start learning',
    endDate: 'Ends',
    noDeadline: 'No deadline',
    tabContent: 'Content',
    tabProgress: 'Progress',
    tabDates: 'Important Dates',
    tabDiscussion: 'Discussion',
    tabNotes: 'Notes',
    progressTitle: 'Learning Progress',
    completedPercent: 'completed',
    lessonCount: 'Lessons',
    lessonsCompleted: 'Completed',
    contentParts: 'Content parts',
    courseOverview: 'Course Overview',
    startLearning: 'Start Learning',
    selectLesson: 'Select a lesson from the left sidebar',
    video: 'Video',
    quiz: 'Quiz',
    backToContent: 'Back to content',
    next: 'Next',
    prev: 'Previous',
    bookmark: 'Bookmark this page',
    lessonObjectives: 'Lesson Objectives',
    lessonContent: 'Lesson Content',
    videoLecture: 'Video Lecture',
    videoWatched: 'Watched video',
    watched: 'Watched',
    importantDates: 'Important Dates',
    startDate: 'Start Date',
    discussionDev: 'Discussion feature is under development.',
    notesDev: 'Notes feature is under development.',
    preparingContent: 'Preparing learning content...',
    tabCourse: 'Course',
    mainLessons: 'Main Lessons',
    curriculumContent: 'Curriculum',
    expandAll: 'Expand all',
    collapseAll: 'Collapse all',
    continueWhereLeft: 'Continue where you left off',
    continueCourse: 'Continue Course',
    lesson: 'Lesson',
    introVideo: 'Course intro video',
    introVideoShort: 'Intro video',
    retry: 'Retry',
    sectionIntro: 'Section Introduction',
    welcomeCourse: 'Welcome to the course! See the overview below.',
    backToDashboard: 'Back to Dashboard',
    exploreCourses: 'Explore Courses',
    exploreCoursesDesc: 'Choose a course and start learning.',
    searchPlaceholder: 'Search by name, code or category...',
    noCoursesFound: 'No courses found',
    noCoursesFoundHint: 'Try changing your search or come back later.',
    code: 'Code',
    viewDetails: 'View Details',
    courseIntro: 'Course Introduction',
    noLessonsYet: 'No lessons yet. Content will be updated when the instructor adds lessons.',
    noContentYet: 'No content yet',
    featureDev: 'Feature is under development.',
    enterCourse: 'Enter Course',
    enrollCourse: 'Enroll',
    youWillGet: 'What you will get',
    benefitVideos: 'Full video lectures & materials',
    benefitQuiz: 'Quizzes & assignments',
    benefitCert: 'Digital certificate on completion',
    quizPassed: 'Congratulations! You passed.',
    quizFailed: 'Sorry! You need to try harder.',
    correctCount: 'Correct answers',
    submitQuiz: 'Submit',
    categoryDefault: 'Category',
    noDescription: 'No description for this course.',
    contactTitle: 'DIGITAL LEARNING CENTER - E-LEARNING',
    downloadApp: 'Download App',
    connect: 'Connect',
    termsPolicy: 'Terms & Policy',
    termsOfUse: 'Terms of Use',
    privacyPolicy: 'Privacy Policy',
    copyright: 'All rights reserved.',
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'vi';
    } catch {
      return 'vi';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang === 'vi' ? 'vi' : 'en';
    } catch {}
  }, [lang]);

  const setLang = useCallback((l) => {
    if (l === 'vi' || l === 'en') setLangState(l);
  }, []);

  const t = useCallback((key) => {
    const dict = translations[lang] || translations.vi;
    return dict[key] ?? translations.vi[key] ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: 'vi',
      setLang: () => {},
      t: (key) => translations.vi[key] ?? key,
    };
  }
  return ctx;
}
