const scriptURL = 'https://script.google.com/macros/s/AKfycbwAlFYahY3MMbAYLAandgaVXXkJ02qWOodopTszZfiXPqrxeMMWzKTIJaB4zoyw6IRUMQ/exec'

const form = document.getElementById('guestbook');

// 2D button
form.addEventListener('submit', e => {
    e.preventDefault();
    submitGuestBook();
})

function submitGuestBook() {
    console.log('attempting post');
    if (document.getElementById('guestbook-username-field').value == '' || document.getElementById('guestbook-message-field').value == '') {
        alert("Please fill both fields before submiting.");
        return;
    }
    fetch(scriptURL, { method: 'POST', body: new FormData(form)})
    .then(response => alert('Thank you! Your Form is submitted successfully.'))
    .then(() => { window.location.reload(); })
    .catch(error => console.error('Error!', error.message));
}

async function loadEntries() {
    // Send hasVisited cookie with request
    const hasVisited = getCookie("hasVisited") === "true";
    const response = await fetch(`${scriptURL}?hasVisited=${hasVisited}`);
    setCookie('hasVisited', true, 30);

    const entries = await response.json();
    const entriesList = document.getElementById('guestbook-entries');
    entriesList.innerHTML = ''; // Clear the list

    // Render entries
    entries.forEach(([name, message, visitors]) => {
        if (visitors != 0) {
            const visitorCounter = document.getElementById('visitor-counter');
            visitorCounter.innerHTML += visitors;
            return;
        }
        const listItem = document.createElement('li');
        listItem.textContent = `${name}:\n\t${message}`;
        entriesList.appendChild(listItem);
    });
}

function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1);
    if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
  }
  return "";
}

loadEntries();