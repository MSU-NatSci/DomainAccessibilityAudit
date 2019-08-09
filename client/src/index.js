import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

// Accessibility fixes that need to come _before_ the Bootstrap import.
import "oaf-bootstrap-4/scss/top.scss";

// Bootstrap itself.
import "bootstrap/scss/bootstrap.scss";

// Accessibility fixes that need to come _after_ the Bootstrap import.
import "oaf-bootstrap-4/scss/bottom.scss";


ReactDOM.render(<App />, document.getElementById('root'));

serviceWorker.unregister();
