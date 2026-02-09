// templates/promptTemplates.js
export const PROMPT_TEMPLATES = {
  default: {
    name: "Default Receptionist",
    body: `You are a virtual receptionist for {{clinic_name}}...`
  },
  booking: {
    name: "Booking-Focused",
    body: `You help callers book quickly...`
  },
  after_hours: {
    name: "After-Hours Only",
    body: `You answer missed calls outside business hours...`
  }
};
