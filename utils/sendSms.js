export async function sendBookingSms({ to, bookingLink, clinicName }) {
  if (!to || !bookingLink) return;

  const message =
`Thanks for calling ${clinicName}.
Book your appointment here: ${bookingLink}

Reply STOP to opt out.`;

  await client.messages.create({
    from: process.env.TWILIO_PHONE,
    to,
    body: message,
  });
}
