// ─────────────────────────────────────────────────────────────────────────────
// Block details shown in the "SELECTED" card (from Ramachandra_College_Campus_Block_Descriptions.pdf).
// Key = building id from config.js. Each entry: { title, points: [3 bullet lines], tags?: [...] }
// Edit the text here – no UI code needs to change.
// ─────────────────────────────────────────────────────────────────────────────
const SPORTS = {
  title: 'Sports Grounds & Courts',
  points: [
    'Features dedicated facilities for Cricket, Volleyball, Kabaddi, and Badminton.',
    'Encourages physical fitness, teamwork, and competitive sports activities.',
    'Provides opportunities for recreation and overall student development.',
  ],
};

export const BLOCK_DETAILS = {
  admin: {
    title: 'Admin Block',
    points: [
      'The administrative headquarters of the college, managing institutional operations and academic affairs.',
      'Houses the offices of the Managing Director (MD), Principal, and HR.',
      'Serves as the central hub for college management and administration.',
    ],
    tags: ['MD', 'Principal', 'HR'],
  },
  a: {
    title: 'A Block (Savestra)',
    points: [
      'Dedicated to Civil and Mechanical Engineering departments.',
      'Features 2 Physics Labs, 2 Chemistry Labs, an English Vocabulary Lab, and student medical facilities.',
      'Supports practical learning, scientific experiments, and academic development.',
    ],
    tags: ['Civil', 'Mechanical', 'Physics Labs ×2', 'Chemistry Labs ×2', 'English Lab', 'Medical'],
  },
  b: {
    title: 'B Block (Vidhra)',
    points: [
      'Houses M.Tech, MBA, BBA, ECE, and EEE departments.',
      'Equipped with EEE laboratories and seminar halls for academic activities.',
      'Promotes technical education, management studies, and collaborative learning.',
    ],
    tags: ['M.Tech', 'MBA', 'BBA', 'ECE', 'EEE', 'Seminar Halls'],
  },
  c: {
    title: 'C Block (Shastra)',
    points: [
      'Home to CSE, Cybersecurity, AI & DS, AIML, and IoT departments.',
      'Features advanced computer laboratories for programming, development, and research.',
      'Encourages innovation in emerging technologies and hands-on technical learning.',
    ],
    tags: ['CSE', 'Cybersecurity', 'AI & DS', 'AIML', 'IoT'],
  },
  openAuditorium: {
    title: 'Open Auditorium',
    points: [
      'An open-air venue for cultural celebrations and student activities.',
      'Hosts festivals, performances, competitions, and college events.',
      'Encourages creativity, student participation, and campus engagement.',
    ],
  },
  auditorium: {
    title: 'Auditorium',
    points: [
      'A dedicated indoor space for academic and institutional gatherings.',
      'Hosts seminars, conferences, workshops, and guest lectures.',
      'Provides an environment for presentations, learning, and knowledge sharing.',
    ],
  },
  temple: {
    title: 'Temple',
    points: [
      'A peaceful spiritual space within the college campus.',
      'Provides an environment for prayer, reflection, and religious activities.',
      'Promotes spiritual well-being and inner peace.',
    ],
  },
  boys: {
    title: 'Boys Hostel',
    points: [
      'Provides residential accommodation for male students within the campus.',
      'Offers a comfortable environment for studying, relaxation, and student life.',
      'Encourages independence, discipline, and community living.',
    ],
  },
  girls: {
    title: 'Girls Hostel',
    points: [
      'A dedicated residential facility for female students.',
      'Provides a comfortable and secure environment for academic and personal growth.',
      'Supports student well-being, independence, and community living.',
    ],
  },
  mechlab: {
    title: 'Mechanical Lab',
    points: [
      'Equipped with advanced machinery and modern mechanical engineering equipment.',
      'Provides hands-on training in machining, manufacturing, and mechanical systems.',
      'Enhances practical engineering skills, experimentation, and technical expertise.',
    ],
    tags: ['Machining', 'Manufacturing', 'Mechanical Systems'],
  },
  // the four sports tour stops share the "Sports Grounds & Courts" write-up
  cricket: SPORTS, volleyball: SPORTS, badminton: SPORTS, kabaddi: SPORTS,
};
