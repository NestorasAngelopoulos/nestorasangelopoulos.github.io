const scriptURL = 'https://script.google.com/macros/s/AKfycbz8onyxhjYYf8HocUCED87IuoRy-LFgKDJaoqpDKxiDUzXrmL27JIM8Po57xam7XuEL/exec'

const form = document.forms['guestbook-form']

form.addEventListener('submit', e => {
    e.preventDefault()
    fetch(scriptURL, { method: 'POST', body: new FormData(form)})
    .then(response => alert("Thank you! Yout Form is submitted successfully."))
    .then(() => { window.location.reload(); })
    .catch(error => console.error('Error!', error.message));
})

async function loadEntries() {
    const response = await fetch(scriptURL);
    const entries = await response.json();
    const entriesList = document.getElementById('guestbook-entries');
    entriesList.innerHTML = ''; // Clear the list

    // Render entries
    entries.forEach(([name, message]) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${name}: ${message}`;
        entriesList.appendChild(listItem);
    });
}

loadEntries();