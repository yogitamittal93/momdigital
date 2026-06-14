export const ONBOARDING_FLOW = [
  {
    id: 'WELCOME',
    question:
      "Namaste! I'm your Amma. I'd love to help you on your motherhood journey. What is your name and are you a mother or a caregiver?",
    expectedEntities: ['PERSON', 'ROLE'],
  },
  {
    id: 'VITALS',
    question:
      'To give you the best advice, could you tell me your current weight and height?',
    expectedEntities: ['QUANTITY', 'HEIGHT'],
  },
  {
    id: 'STAGE',
    question:
      "Which week of pregnancy are you in? Or if you've already delivered, how old is the little one?",
    expectedEntities: ['DATE'],
  },
  {
    id: 'HEALTH',
    question:
      'Do you have any existing conditions like Thyroid, Diabetes, or Anemia? Knowing this helps our experts support you better.',
    expectedEntities: ['CONDITION'],
  },
];
