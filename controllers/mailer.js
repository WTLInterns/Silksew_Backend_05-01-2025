const nodemailer = require("nodemailer");

const sendOrderConfirmationEmail = async (
  email,
  items,
  totalAmount,
  address
) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
 
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🎉 Order Confirmation - Thank You for Your Purchase!",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #2c3e50;">Thank You for Your Order!</h2>
            <p>Hello,</p>
            <p>Your order has been successfully placed. Below are the details of your purchase:</p>
    
            <h3 style="color: #16a085;">Order Details:</h3>
    
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background-color: #f8f9fa;">
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Product</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Quantity</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${items
                      .map(
                        (item) => `
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 10px;">${
                                  item.name
                                }</td>
                                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${
                                  item.quantity
                                }</td>
                               
                                <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">Rs.${item.price?.toFixed(2)}</td>
                            </tr>
                            `
                      )
                      .join("")}
                    <tr style="background-color: #f8f9fa; font-weight: bold;">
                        <td colspan="2" style="border: 1px solid #ddd; padding: 10px; text-align: right;">Total Amount:</td>
                        <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #28a745;">Rs.${totalAmount.toFixed(
                          2
                        )}</td>
                    </tr>
                </tbody>
            </table>
    
            <hr style="border: 0; border-top: 1px solid #ddd;" />
    
            <p>We truly appreciate your business and look forward to serving you again.</p>
            <p>If you have any questions, feel free to contact us at <a href="silksew30@gmail.com">silksew30@gmail.com</a>.</p>
    
            <p style="font-size: 14px; color: #777;">Best Regards,<br><strong>Silksew</strong></p>
        </div>
        `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Order confirmation email sent successfully");

  

    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Admin email from environment variables
      subject: "🛒 New Order Received",
      html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #007bff;">📦 New Order Notification</h2>
                    <p>Hello Admin,</p>
                    <p>A new order has been placed by <strong>${email}</strong>. Please review the order details below:</p>
                    
                    <h3 style="margin-top: 20px; border-bottom: 2px solid #007bff; padding-bottom: 5px;">Order Summary</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #f8f8f8;">
                                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Products</th>
                                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Quantity</th>
                                <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items
                              .map(
                                (item) => `
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${
                                      item.name
                                    }</td>
                                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${
                                      item.quantity
                                    }</td>
                                    <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">Rs.${item.price?.toFixed(2)}</td>
                                </tr>
                            `
                              )
                              .join("")}
        
                            <!-- Total Amount Row -->
                            <tr style="background-color: #f8f8f8; font-weight: bold;">
                                <td colspan="2" style="padding: 10px; border: 1px solid #ddd; text-align: right;">Total Amount:</td>
                                <td style="padding: 10px; border: 1px solid #ddd; text-align: right; color: #28a745;">Rs.${totalAmount.toFixed(
                                  2
                                )}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <p style="margin-top: 20px;">Please review the order details in the admin panel.</p>
                    <p>Best regards,<br><strong>Your Store Team</strong></p>
                </div>
            `,
    };

    await transporter.sendMail(adminMailOptions);
    console.log("Order notification email sent to admin successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = sendOrderConfirmationEmail;
