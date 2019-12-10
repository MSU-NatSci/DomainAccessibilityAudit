import React from 'react';
import { faUniversalAccess } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


const Header = () => {
  return (
    <header>
      <p className="bannerTitle">
        <a href="https://github.com/MSU-NatSci/DomainAccessibilityAudit">
          Domain Accessibility Audit
        </a>&nbsp;
        <FontAwesomeIcon icon={faUniversalAccess} color="#3e50b4" size="lg"/>
      </p>
    </header>
  );
};

export default Header;
