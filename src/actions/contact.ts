'use server';

import * as z from 'zod';

// Define the shape of the form data
const contactSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

// Define the shape of the return value
export type ContactFormState = {
  success: boolean;
  message: string;
};

/**
 * Server action to handle the contact form submission.
 * In a real-world app, this is where you'd integrate with an email service like Resend or SendGrid.
 * @param prevState - The previous state of the form.
 * @param formData - The data from the contact form.
 * @returns A state object with success status and a message.
 */
export async function submitContactForm(
    prevState: ContactFormState,
    formData: FormData
  ): Promise<ContactFormState> {

  const validatedFields = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  });

  // If validation fails, return the errors
  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.flatten().fieldErrors.message?.[0] || "Invalid data provided."
    };
  }

  const { name, email, message } = validatedFields.data;

  // --- EMAIL SENDING LOGIC (SIMULATED) ---
  // In a real application, you would use a service like Resend, Nodemailer, or SendGrid here.
  // For example:
  // try {
  //   await resend.emails.send({
  //     from: 'Contact Form <noreply@yourdomain.com>',
  //     to: 'support@ludoleague.com',
  //     subject: `New message from ${name}`,
  //     reply_to: email,
  //     html: `<p>You have a new contact form submission from:</p>
  //            <p><strong>Name:</strong> ${name}</p>
  //            <p><strong>Email:</strong> ${email}</p>
  //            <p><strong>Message:</strong></p>
  //            <p>${message}</p>`
  //   });
  // } catch (error) {
  //   console.error("Email sending failed:", error);
  //   return { success: false, message: "Failed to send message. Please try again later." };
  // }
  
  console.log("--- SIMULATING EMAIL ---");
  console.log(`To: support@ludoleague.com`);
  console.log(`From: ${name} <${email}>`);
  console.log(`Message: ${message}`);
  console.log("-------------------------");

  // If everything is successful, return a success message.
  return { success: true, message: "Your message has been sent successfully!" };
}
