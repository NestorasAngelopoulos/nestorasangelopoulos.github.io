const scriptURL = 'https://script.google.com/macros/s/AKfycby-0B41vuDHN9gGH0UzdLlt1fWcISftuXVSPAe7nswjm1_kNIsC9Lm2uhUYIRpGBiUXpg/exec'

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
    .then(response => alert('Thank you! Yout Form is submitted successfully.'))
    .then(() => { window.location.reload(); })
    .catch(error => console.error('Error!', error.message));
}

async function loadEntries() {
    const response = await fetch(scriptURL);
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

loadEntries();
