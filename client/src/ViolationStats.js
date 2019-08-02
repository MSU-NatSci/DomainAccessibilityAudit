import React, { Component } from 'react';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import './ViolationStats.css';


class ViolationStats extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      items: null,
      seeItemsViolationId: null,
    };
    this.itemPlural = this.props.itemType + "s";
  }
  
  seeItems(violationId) {
    if (this.state.seeItemsViolationId === violationId)
      this.setState({ seeItemsViolationId: null });
    else
      this.setState({ seeItemsViolationId: violationId });
  }
  
  itemTitle(id) {
    for (let item of this.props.items) {
      if (item._id === id)
        return item.url ? item.url : item.name;
    }
    return null;
  }
  
  violationItems(id) {
    return (
      <>
        {this.state.seeItemsViolationId === id &&
          <div className="violationItems">
            {this.props.stats[id][this.itemPlural]
              .sort((item1, item2) => {
                const cd = item2.count - item1.count;
                if (cd !== 0)
                  return cd;
                return this.itemTitle(item1.id).localeCompare(
                  this.itemTitle(item2.id));
              })
              .map(item => 
              <div key={item.id}>
                <Link to={'/' + this.itemPlural + '/' + item.id}>{this.itemTitle(item.id)}</Link>
                {' '}{item.count}
              </div>
            )}
          </div>
        }
      </>
    );
  }
  
  violationRow(id) {
    const v = this.props.stats[id];
    return (
      <tr key={id}>
        <td className="code">
          <a href={v.descLink} target="_blank" rel="noopener noreferrer">{v.description}</a>
          {this.props.items && v[this.itemPlural] &&
              v[this.itemPlural].length > 0 &&
            <>
              {' '}
              <Button variant="info" size="xs" onClick={e => this.seeItems(id)}>
                {this.state.seeItemsViolationId === id ?
                  "Hide "+this.itemPlural :
                  "See "+this.itemPlural}
              </Button>
              {this.violationItems(id)}
            </>
          }
        </td>
        <td className={v.impact}>{v.impact}</td>
        <td className="text-right">{v.total}</td>
      </tr>
    );
  }
  
  render() {
    let stats = this.props.stats;
    const impacts = new Map([
      ['minor', 0],
      ['moderate', 1],
      ['serious', 2],
      ['critical', 3],
    ]);
    return (
      <Table bordered size="sm" className="data">
        <caption>VIOLATIONS</caption>
        <thead>
          <tr>
            <th>description</th>
            <th>impact</th>
            <th className="text-right">total</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(stats).length === 0 ?
            <tr><td colSpan="3" className="text-center">None</td></tr> :
            <>
              {Object.keys(stats)
                .sort((id1,id2) => {
                  let td = impacts.get(stats[id2].impact) -
                    impacts.get(stats[id1].impact);
                  if (td === 0)
                    td = stats[id2].total - stats[id1].total;
                  return td;
                })
                .map(id => this.violationRow(id))
              }
            </>
          }
        </tbody>
      </Table>
    );
  }
  
}

ViolationStats.propTypes = {
  stats: PropTypes.object,
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    count: PropTypes.number,
  })),
  itemType: PropTypes.string,
};

export default ViolationStats;
