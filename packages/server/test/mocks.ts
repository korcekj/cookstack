vi.mock('../src/services/email', () => {
  return {
    initializeEmail: () => ({
      send: vi.fn().mockImplementation(async email => true),
      templates: {
        verificationCode: vi.fn().mockReturnValue('verification_code_template'),
        resetPassword: vi.fn().mockReturnValue('reset_password_template'),
      },
    }),
  };
});

vi.mock('../src/services/image', () => {
  return {
    initializeImage: () => ({
      upload: vi.fn().mockImplementation(async (file, options) => ({
        eager: [
          {
            secure_url: 'https://mock-cloudinary.com/test.jpg',
          },
        ],
      })),
    }),
  };
});
