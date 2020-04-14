const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeMail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'shreepoornaadarshasrivatsa@gmail.com',
        subject: 'Welocme',
        text: `Welcome to the app, ${name}. Let me know how you get along.`
    })
    .then(console.log('Mail Sent!'))
    .catch(err => console.log(err.toString()))
}

const sendExitMail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'shreepoornaadarshasrivatsa@gmail.com',
        subject: 'Thankyou for using',
        text: `Thankyou  ${name}. Please get me the feedback how can I improve the application.`
    })
    .then(console.log('Mail Sent!'))
    .catch(err => console.log(err.toString()))
}

module.exports = {
    sendWelcomeMail,
    sendExitMail
}