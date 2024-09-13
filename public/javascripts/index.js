// ## Common Javascript functionality to get started:
//
// # Read url parameter
// const x = urlParams.get('x');
//
// # Get html element
// const errorMessage = document.getElementById('error-message');
//
// # Set text content
// errorMessage.textContent = 'Nothing to see here.';
//
// # Disable element 
// resetButton.disabled = true;
//
// # Add / Remove css class
// errorMessage.classList.add('hidden');
// errorMessage.classList.remove('hidden');
//
// # Add event listener for Cancel button
// cancelButton.addEventListener('click', function() {
//     doSomething();
// });
//
// # Http fetch:
// fetch(url, {
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({
//         a: "b"
//     })
// })
//     .then(response => {
//         if (response.ok) {
//             let json = response.json();
//             doSomethingWithJson(json);
//         } else {
//             console.error('Something went wrong');
//         }
//     })
//     .catch(error => {
//         console.error('Error:', error);
//     });
//
// # Set global css variables:
// document.documentElement.style.setProperty('--form-border-color', data.data.accentColor);
//
// # Basepath: https://connect-prod.cidaas.eu

/**
 * This is already quite pre-written, to allow the basic login functionality.
 * 
 * There are lots of things you should improve on though:
 * 
 * 1. - Load the public information from the backend & set the styles.
 * Set the displayed login options (username, email, mobile) accordingly.
 * Set the remember_me accordingly.
 * 
 * 2. - Load & display the user configured authentication methods (Password, Email OTP, SMS etc.)
 *  API: POST https://connect-prod.cidaas.eu/verification-srv/v2/setup/public/configured/list -> Returns medium id for later use
 *  RequestBody: {"request_id":requestId,"email":email} // Email can be username or mobile
 *  
 * 3. Upon clicking on the 'EMail-OTP' button, the Passwordless login flow should be started.
 *  API: POST https://connect-prod.cidaas.eu/verification-srv/v2/authenticate/initiate/email -> Returns exchange_id for later use
 *  RequestBody: {"usage_type":"PASSWORDLESS_AUTHENTICATION","request_id":requestId,"medium_id":medium_id,"type":"email","email":email}
 * 
 * 4. Upon succes, show an verification input html element
 * 5. When clicking this, call the API to verify the code
 *  API: POST https://connect-prod.cidaas.eu/verification-srv/v2/authenticate/authenticate/email
 *  RequestBody: {"requestId":requestid,"exchange_id":exchange_id,"type":"email","pass_code":"123"}
 * 
 * 6. When successfull, call the login-srv API via the create form post.
 * 
 * If unsure on what to do, you can take the default hosted pages as working example, open this url in a browser without valid SSO Session:  
 * https://connect-prod.cidaas.eu/authz-srv/authz?client_id=d83ecbba-7022-4eb0-adf7-f1f503eec552&response_type=token&redirect_uri=https://connect-prod.cidaas.eu/user-profile/editprofile
 * 
 */
document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const loginOptions = document.getElementById('login-options');
    const inputContainer = document.getElementById('input-container');
    const passwordContainer = document.getElementById('password-container');
    const loginInput = document.getElementById('login-input');
    const passwordInput = document.getElementById('password-input');
    const nextBtn = document.getElementById('next-btn');
    const loginBtn = document.getElementById('login-btn');
    const selectedOption = document.getElementById('selected-option');

    let currentOption = '';

    function setActiveButton(clickedButton) {
        const buttons = loginOptions.getElementsByTagName('button');
        for (let button of buttons) {
            button.classList.remove('active');
        }
        clickedButton.classList.add('active');
    }

    loginOptions.addEventListener('click', function (e) {
        if (e.target.tagName === 'BUTTON') {
            setActiveButton(e.target);
            currentOption = e.target.textContent;
            loginInput.placeholder = `Enter your ${currentOption}`;
            inputContainer.classList.remove('hidden');
            passwordContainer.classList.add('hidden');
        }
    });

    nextBtn.addEventListener('click', function () {
        if (loginInput.value.trim() !== '') {
            selectedOption.textContent = `${currentOption}: ${loginInput.value}`;
            inputContainer.classList.add('hidden');
            passwordContainer.classList.remove('hidden');
        }
    });

    loginBtn.addEventListener('click', function () {
        if (passwordInput.value.trim() !== '') {
            const requestId = urlParams.get('requestId');
            const password = document.getElementById('password-input').value;
            const username = document.getElementById('login-input').value;
            initiateLogin(requestId, username, password);
        }
    });

    // Forgot password button logic
    const forgotPasswordBtn = document.getElementById('forgot-password-btn');
    forgotPasswordBtn.addEventListener('click', function () {
        forgotPassword();
    });

    function forgotPassword() {
        const requestId = urlParams.get('requestId');
        const userIdHint = document.getElementById('login-input').value;
        const type = currentOption;
        const url = `https://connect-prod.cidaas.eu/custom-hp/password_forgot_init?userIdHint=${userIdHint}&requestId=${requestId}&type=${type}`;
        window.location.href = url
        return;
    }

    function initiateLogin(requestId, username, password) {
        // Implement your login logic here
        let initiatePWUrl = "https://connect-prod.cidaas.eu/verification-srv/v2/authenticate/initiate/password"
        let body = {
            "usage_type": "PASSWORDLESS_AUTHENTICATION",
            "request_id": requestId,
            "medium_id": "PASSWORD",
            "type": "password",
            "email": username
        }
        fetch(initiatePWUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }).then(response => {
                if (response.ok) {
                    response.json().then(json => {
                        console.log(json)
                        if (json.data.exchange_id) {
                            let exchangeId = json.data.exchange_id.exchange_id;
                            console.log(exchangeId);
                            authenticate(requestId, exchangeId, username, password);
                        }
                    })
                } else {
                    console.error('Something went wrong');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    // Example usage of showLoginOptions function
    showLoginOptions(["EMAIL", "MOBILE", "USER_NAME"]);
});

function authenticate(requestId, exchangeId, username, password) {
    let url = "https://connect-prod.cidaas.eu/verification-srv/v2/authenticate/authenticate/password";
        let rememberMe = false;
        let body = {
            username: username,
            password: password,
            requestId: requestId,
            rememberMe: rememberMe,
            exchange_id: exchangeId,
            type: "password"
          }
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
            .then(response => {
                if (response.ok) {
                    let json = response.json().then((json) => {
                        if (json.data.exchange_id) {
                            let exchangeId = json.data.exchange_id.exchange_id;
                            let status_id = json.data.status_id;
                            let sub = json.data.sub;
                            let authObj = {
                                "exchange_id": exchangeId,
                                "status_id": status_id,
                                "sub": sub,
                                "requestId": requestId,
                                "verificationType": "password",
                                "rememberMe": true // Change this according to the public information from the app
                            }
                            //requestId=&exchange_id=&verificationType=password&sub=&status_id=&rememberMe=true&lat=&lon=
                            console.log(authObj);
                            let loginURL = "https://connect-prod.cidaas.eu/login-srv/verification/login";
                            createFormPost(loginURL, authObj)
                        }
                    })
                    console.log(json)
                } else {
                    console.error('Something went wrong');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
}

// We are using a form post, because we want to automatically follow redirects
function createFormPost(url, body) {
    try {
        const form = document.createElement('form');
        form.action = url;
        form.method = 'POST';
        for (const key in body) {
            if (body.hasOwnProperty(key)) {
                const hiddenField = document.createElement("input");
                hiddenField.setAttribute("type", "hidden");
                hiddenField.setAttribute("name", key);
                hiddenField.setAttribute("value", body[key]);

                form.appendChild(hiddenField);
            }
        }
        document.body.appendChild(form);
        form.submit();
    } catch (ex) {
        document.getElementById('error-message').textContent = 'Error: ' + ex.message;
        document.getElementById('error-message').classList.remove('hidden');
    }
}

function showLoginOptions(options) {
    const buttonMap = {
        'EMAIL': document.getElementById('email-btn'),
        'MOBILE': document.getElementById('mobile-btn'),
        'USER_NAME': document.getElementById('username-btn')
    };

    for (let option in buttonMap) {
        if (options.includes(option)) {
            buttonMap[option].style.display = 'inline-block';
        } else {
            buttonMap[option].style.display = 'none';
        }
    }
}

/**
 * TODO: Public information.
 * Set the displayed login options (username, email, mobile) accordingly.
 * Set the remember_me accordingly.
 * 
 * @param {*} requestId 
 */
function loadStylingInformation(requestId) {
    url = "https://connect-prod.cidaas.eu/public-srv/public/" + requestId;
}