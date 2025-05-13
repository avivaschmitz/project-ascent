# Heroku HTML/CSS Application Boilerplate

A simple HTML/CSS application skeleton that's ready to deploy to Heroku.

## Features

- Express.js server to serve static files
- Responsive design with modern CSS
- Mobile-friendly layout
- Ready for immediate deployment to Heroku

## Project Structure

```
my-heroku-app/
├── public/              # Static files served by Express
│   ├── css/
│   │   ├── normalize.css # CSS reset
│   │   └── styles.css    # Main stylesheet
│   ├── js/
│   │   └── main.js       # JavaScript functionality
│   └── index.html        # Main HTML file
├── .gitignore           # Git ignore file
├── package.json         # Project dependencies and scripts
├── Procfile             # Heroku process file
└── server.js            # Express server setup
```

## Local Development

1. Clone this repository
2. Install dependencies
   ```
   npm install
   ```
3. Start the development server
   ```
   npm start
   ```
4. Visit `http://localhost:3000` in your browser

## Deployment to Heroku

1. Create a Heroku account if you don't have one
2. Install the Heroku CLI
3. Login to Heroku
   ```
   heroku login
   ```
4. Create a new Heroku app
   ```
   heroku create your-app-name
   ```
5. Deploy to Heroku
   ```
   git push heroku main
   ```
6. Open your application
   ```
   heroku open
   ```

## Customization

- Replace the content in `index.html` with your own
- Modify the styles in `public/css/styles.css`
- Add your own JavaScript functionality in `public/js/main.js`

## License

MIT