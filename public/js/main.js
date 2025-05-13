// Main JavaScript file

document.addEventListener('DOMContentLoaded', function() {
  // Get the button element
  const getStartedBtn = document.querySelector('.primary-btn');

  // Add event listener to the button
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', function() {
      alert('Welcome to your new Heroku app! This is where your app logic would go.');
    });
  }

  // You can add more JavaScript functionality here
  console.log('App initialized successfully!');
});