class ApiEndpoints {
  ApiEndpoints._();

  static const String baseUrl = 'https://api.elm5tber.com/api/v1';

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String refreshToken = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String profile = '/auth/profile';
  static const String updateProfile = '/auth/profile';
  static const String changePassword = '/auth/change-password';
  static const String forgotPassword = '/auth/forgot-password';
  static const String verifyOtp = '/auth/verify-otp';
  static const String resetPassword = '/auth/reset-password';
  static const String enable2FA = '/auth/2fa/enable';
  static const String verify2FA = '/auth/2fa/verify';
  static const String disable2FA = '/auth/2fa/disable';

  // Appointments
  static const String appointments = '/appointments';
  static const String appointmentDetail = '/appointments/{id}';
  static const String createAppointment = '/appointments';
  static const String cancelAppointment = '/appointments/{id}/cancel';
  static const String rescheduleAppointment = '/appointments/{id}/reschedule';
  static const String availableSlots = '/appointments/slots';
  static const String queueStatus = '/appointments/queue/{id}';
  static const String queueTicket = '/appointments/queue/ticket';

  // Branches
  static const String branches = '/branches';
  static const String branchDetail = '/branches/{id}';
  static const String nearbyBranches = '/branches/nearby';
  static const String branchServices = '/branches/{id}/services';
  static const String branchReviews = '/branches/{id}/reviews';

  // Results
  static const String results = '/results';
  static const String resultDetail = '/results/{id}';
  static const String resultPdf = '/results/{id}/pdf';
  static const String resultComparison = '/results/comparison';
  static const String healthTimeline = '/results/timeline';
  static const String resultQr = '/results/{id}/qr';
  static const String resultBarcode = '/results/{id}/barcode';
  static const String resultShare = '/results/{id}/share';

  // Payments
  static const String invoices = '/payments/invoices';
  static const String invoiceDetail = '/payments/invoices/{id}';
  static const String processPayment = '/payments/process';
  static const String wallet = '/payments/wallet';
  static const String walletTransactions = '/payments/wallet/transactions';
  static const String paymentMethods = '/payments/methods';
  static const String addPaymentMethod = '/payments/methods';
  static const String deletePaymentMethod = '/payments/methods/{id}';
  static const String installments = '/payments/installments';
  static const String subscriptions = '/payments/subscriptions';

  // Notifications
  static const String notifications = '/notifications';
  static const String markNotificationRead = '/notifications/{id}/read';
  static const String markAllNotificationsRead =
      '/notifications/mark-all-read';
  static const String notificationPreferences =
      '/notifications/preferences';
  static const String notificationToken = '/notifications/token';

  // Family
  static const String familyMembers = '/family';
  static const String familyMemberDetail = '/family/{id}';
  static const String createFamilyMember = '/family';
  static const String updateFamilyMember = '/family/{id}';
  static const String deleteFamilyMember = '/family/{id}';

  // Medicine Reminders
  static const String medicines = '/medicine';
  static const String medicineDetail = '/medicine/{id}';
  static const String createMedicine = '/medicine';
  static const String updateMedicine = '/medicine/{id}';
  static const String deleteMedicine = '/medicine/{id}';
  static const String markMedicineTaken = '/medicine/{id}/taken';

  // AI Assistant
  static const String aiChat = '/ai/chat';
  static const String aiChatStream = '/ai/chat/stream';
  static const String aiVoiceQuery = '/ai/voice';
  static const String aiConversations = '/ai/conversations';
  static const String aiConversationDetail = '/ai/conversations/{id}';
  static const String aiDeleteConversation = '/ai/conversations/{id}';

  // General
  static const String contactUs = '/contact';
  static const String faq = '/faq';
  static const String appVersion = '/app/version';
  static const String healthCheck = '/health';
}
