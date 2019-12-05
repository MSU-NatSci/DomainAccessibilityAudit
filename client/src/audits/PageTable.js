import React from 'react';
import Table from 'react-bootstrap/Table';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';


const PageTable = ({ domain }) => {
  return (
    <section>
      <h2>Scanned Pages</h2>
      <p style={{marginBottom: 0}}>Click on a URL to get a full report for that page.</p>
      <Table bordered size="sm" className="data">
        <thead>
          <tr><th>URL</th><th className="text-right">Violations</th></tr>
        </thead>
        <tbody>
          {domain.pages.map(page => (
            <tr key={page._id}>
              <td className="code">
                <Link to={'/pages/'+page._id}>{page.url}</Link>
              </td>
              <td className="text-right">{page.nbViolations}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </section>
  );
};

PageTable.propTypes = {
  domain: PropTypes.object.isRequired,
};

export default PageTable;
