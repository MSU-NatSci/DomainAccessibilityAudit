import React from 'react';
import ReactDOM from 'react-dom';

// Bootstrap (we only need the SCSS, there is no need for any Javascript
// with react-bootstrap).
import "bootstrap-scss/bootstrap.scss";

import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(<App />, document.getElementById('root'));

serviceWorker.unregister();
