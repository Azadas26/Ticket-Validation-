const { MailerSend, EmailParams } = require('mailersend');
var opt = require('./otp')
var promise = require('promise')

module.exports = {
    mail_sender_api_Call: (usermail) => {
        return new promise((resolve, reject) => {
            console.log("Called");
            opt.otp_generation_for_User_Authentication().then((otp) => {
                console.log(otp);
                const mailersend = new MailerSend({
                    apiKey: "mlsn.4af1b4d327d1f52f28ea5e97cc1443f6aedfaa12e10db63fffd31420ff80abe0",
                });

                const emailParams = {
                    from: {
                        email: "your-email@trial-7dnvo4dj7kn45r86.mlsender.net", // Use the verified trial domain email
                        name: "Ticker_Sure"          // Optional sender name
                    },
                    to: [
                        {
                            email: usermail,
                            name: "Recipient"
                        }
                    ],
                    subject: "Test Subject",
                    html: `<div class="container-fluid d-flex" id="otpcontainer" style="height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;">
    <div class="row w-100">
        <div class="col-md-12 d-flex justify-content-center align-items-center">
            <div class="text-center">
                <h1 style="font-family: sans-serif;font-weight: 800;color: #007bff;">TICKET SURE</h1> <br><br>
                 <h4>To authenticate, please use the following One Time Password (OTP):</h4>
                <i class="fa fa-envelope" style="font-size:48px;color:rgba(66, 94, 237, 0.8);font-size: 80px;"></i>
                <h2 class="mt-5" style="font-family: sans-serif;font-weight: 800;color: rgb(74, 76, 77);">Your One Time
                    Password Is
                </h2>
               
                <h1 style="font-weight: 800;font-style: italic;color: #858585;">${otp}</h1>

                <h4>Don't share this OTP with anyone. Our customer service team will never ask you for your password, OTP, credit card, or banking info.
We hope to see you again soon.</h4>
            </div>
        </div>
    </div>
</div>
`,
                    text: "Greetings from the team, you got this message through MailerSend."
                };

                mailersend.email.send(emailParams)
                    .then(response => {
                        console.log("Email sent successfully", response);
                        resolve(otp)
                    })
                    .catch(error => {
                        console.error("Error sending email", error);
                        resolve(otp)
                    });

            })
        })

    }
};
