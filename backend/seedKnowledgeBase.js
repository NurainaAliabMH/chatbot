const mongoose = require('mongoose');
const dotenv = require('dotenv');
const KnowledgeBase = require('./models/KnowledgeBase');

dotenv.config();

const sampleData = [
  {
    category: 'FAQ',
    question: 'What is machine learning?',
    content: 'Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. It uses algorithms to parse data, learn from it, and make informed decisions.',
    keywords: ['machine learning', 'AI', 'algorithms', 'artificial intelligence'],
    metadata: {
      subject: 'Computer Science',
      difficulty: 'Beginner',
    },
  },
  {
    category: 'Course Material',
    question: 'Explain calculus derivatives',
    content: 'A derivative represents the rate of change of a function at a given point. In calculus, if f(x) is a function, its derivative f\'(x) measures how fast f(x) changes as x changes. The derivative is fundamental to understanding motion, optimization, and many other applications in mathematics and physics.',
    keywords: ['calculus', 'derivatives', 'mathematics', 'rate of change'],
    metadata: {
      subject: 'Mathematics',
      difficulty: 'Intermediate',
    },
  },
  {
    category: 'FAQ',
    question: 'How do I prepare for exams?',
    content: 'Effective exam preparation includes: 1) Start early and create a study schedule, 2) Break material into manageable chunks, 3) Use active recall and practice testing, 4) Take regular breaks, 5) Get adequate sleep, 6) Review past papers and practice questions, 7) Study in a distraction-free environment.',
    keywords: ['exam preparation', 'study tips', 'academic success'],
    metadata: {
      subject: 'General',
      difficulty: 'Beginner',
    },
  },
  {
    category: 'Course Material',
    question: 'What is photosynthesis?',
    content: 'Photosynthesis is the process by which plants convert light energy into chemical energy. Plants use sunlight, carbon dioxide, and water to produce glucose and oxygen. The equation is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2. This process occurs primarily in the chloroplasts of plant cells.',
    keywords: ['photosynthesis', 'biology', 'plants', 'chloroplast'],
    metadata: {
      subject: 'Biology',
      difficulty: 'Beginner',
    },
  },
  {
    category: 'Assignment',
    question: 'How to write a research paper?',
    content: 'Writing a research paper involves several steps: 1) Choose a topic and conduct preliminary research, 2) Develop a thesis statement, 3) Create an outline, 4) Write the first draft with proper citations, 5) Revise for clarity and coherence, 6) Proofread for grammar and formatting, 7) Include a bibliography with all sources in the required citation style.',
    keywords: ['research paper', 'writing', 'academic writing', 'thesis'],
    metadata: {
      subject: 'General',
      difficulty: 'Intermediate',
    },
  },
  {
    category: 'Course Material',
    question: 'Explain Newton\'s Laws of Motion',
    content: 'Newton\'s Three Laws of Motion are fundamental principles in physics: 1) First Law (Inertia): An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force. 2) Second Law (F=ma): Force equals mass times acceleration. 3) Third Law: For every action, there is an equal and opposite reaction.',
    keywords: ['physics', 'newton', 'motion', 'force', 'laws'],
    metadata: {
      subject: 'Physics',
      difficulty: 'Intermediate',
    },
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Clear existing data
    await KnowledgeBase.deleteMany({});
    console.log('Cleared existing knowledge base');

    // Insert sample data
    await KnowledgeBase.insertMany(sampleData);
    console.log('Sample data inserted successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedDatabase();