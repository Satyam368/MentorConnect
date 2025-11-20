// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/login`,
  REGISTER: `${API_BASE_URL}/api/register`,
  OTP_SEND: `${API_BASE_URL}/api/otp/send`,
  OTP_VERIFY: `${API_BASE_URL}/api/otp/verify`,
  OTP_RESEND: `${API_BASE_URL}/api/otp/resend`,
  
  // Profile endpoints
  PROFILE: `${API_BASE_URL}/api/profile`,
  PROFILE_BY_EMAIL: (email: string) => `${API_BASE_URL}/api/profile/${encodeURIComponent(email)}`,
  PROFILE_UPLOAD_PICTURE: `${API_BASE_URL}/api/profile/upload-picture`,
  PROFILE_DELETE_PICTURE: `${API_BASE_URL}/api/profile/delete-picture`,
  
  // Booking endpoints
  BOOKINGS: `${API_BASE_URL}/api/bookings`,
  BOOKING_BY_ID: (id: string) => `${API_BASE_URL}/api/bookings/booking/${id}`,
  BOOKINGS_BY_USER: (userId: string) => `${API_BASE_URL}/api/bookings/user/${userId}`,
  BOOKINGS_BY_MENTOR_ID: (mentorId: string) => `${API_BASE_URL}/api/bookings/mentor-id/${mentorId}`,
  BOOKING_UPDATE_STATUS: (id: string) => `${API_BASE_URL}/api/bookings/booking/${id}/status`,
  
  // Mentor endpoints
  MENTORS: `${API_BASE_URL}/api/mentors`,
  STUDENTS: `${API_BASE_URL}/api/students`,
  
  // Chat endpoints
  CHAT_CONVERSATION: (userId: string, otherUserId: string) => `${API_BASE_URL}/api/chat/conversation/${userId}/${otherUserId}`,
  CHAT_CONVERSATIONS: (userId: string) => `${API_BASE_URL}/api/chat/conversations/${userId}`,
  CHAT_UNREAD: (userId: string) => `${API_BASE_URL}/api/chat/unread/${userId}`,
  CHAT_MARK_READ: `${API_BASE_URL}/api/chat/mark-read`,
  CHAT_SEND_MESSAGE: `${API_BASE_URL}/api/chat/message`,
  CHAT_REQUEST_CREATE: `${API_BASE_URL}/api/chat/request`,
  CHAT_REQUEST_PENDING: (userId: string) => `${API_BASE_URL}/api/chat/requests/pending/${userId}`,
  CHAT_REQUEST_ALL: (userId: string) => `${API_BASE_URL}/api/chat/requests/${userId}`,
  CHAT_REQUEST_APPROVE: (requestId: string) => `${API_BASE_URL}/api/chat/request/${requestId}/approve`,
  CHAT_REQUEST_DECLINE: (requestId: string) => `${API_BASE_URL}/api/chat/request/${requestId}/decline`,
  CHAT_PERMISSION_CHECK: (sender: string, receiver: string) => `${API_BASE_URL}/api/chat/permission/${encodeURIComponent(sender)}/${encodeURIComponent(receiver)}`,
  
  // Resource endpoints
  RESOURCE_CREATE: `${API_BASE_URL}/api/resource`,
  RESOURCE_UPLOAD: `${API_BASE_URL}/api/resource/upload`,
  RESOURCE_BY_MENTOR: (mentorEmail: string) => `${API_BASE_URL}/api/resource/mentor/${encodeURIComponent(mentorEmail)}`,
  RESOURCES_ALL: `${API_BASE_URL}/api/resources`,
  RESOURCE_DOWNLOAD: (resourceId: string) => `${API_BASE_URL}/api/resource/download/${resourceId}`,
  RESOURCE_UPDATE: (resourceId: string) => `${API_BASE_URL}/api/resource/${resourceId}`,
  RESOURCE_DELETE: (resourceId: string) => `${API_BASE_URL}/api/resource/${resourceId}`,
  
  // Validation endpoints
  VALIDATION_RULES: `${API_BASE_URL}/api/validation-rules`,
};

// API utility functions
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, defaultOptions);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};