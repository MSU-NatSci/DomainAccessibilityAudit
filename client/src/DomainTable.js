import React from 'react';
import Table from 'react-bootstrap/Table';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';


const DomainTable = ({ audit }) => {
  return (
    <Table bordered size="sm" className="data">
      <caption>DOMAINS</caption>
      <thead>
        <tr>
          <th>Name</th>
          <th className="text-right">Checked URLs</th>
          <th className="text-right">Violations</th>
        </tr>
      </thead>
      <tbody>
        {audit.domains.map(domain => (
          <tr key={domain._id}>
            <td className="code">
              <Link to={'/domains/'+domain._id}>{domain.name}</Link>
            </td>
            <td className="text-right">{domain.nbCheckedURLs}</td>
            <td className="text-right">{domain.nbViolations}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

DomainTable.propTypes = {
  audit: PropTypes.object.isRequired,
};

export default DomainTable;
