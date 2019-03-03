import React from 'react'

const BrowserWarning = (props) =>
  <div>
    <h2>{'You must use this tool with Google Chrome.'}</h2>
    <p>
    {
    `To continue, open this HTML file with Google Chrome. We don’t like the
    new bubble UI either, but it's still the most secure browser.`
    }
    </p>
  </div>

export default BrowserWarning
