package com.tti.paveinsight.services.email;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl {

    private final JavaMailSender javaMailSender;

    public EmailServiceImpl(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

    @Value("spring.mail.username")
    private String username;

    // Method to send a simple email
    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(username);  // Set the 'from' address (can be a fixed email)
        message.setTo(to);                        // Set the recipient's email
        message.setSubject(subject);              // Set the email subject
        message.setText(body);                    // Set the email body

        try {
            javaMailSender.send(message);
            System.out.println("Email sent successfully!");
        } catch (Exception e) {
            System.out.println("Error while sending email: " + e.getMessage());
        }
    }

    // Method to send an email with HTML content
    public void sendHtmlEmail(String to, String subject, String body) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom(username);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);  // Set to true to indicate this is HTML content

            javaMailSender.send(message);
            System.out.println("HTML Email sent successfully!");
        } catch (Exception e) {
            System.out.println("Error while sending HTML email: " + e.getMessage());
        }
    }
}
