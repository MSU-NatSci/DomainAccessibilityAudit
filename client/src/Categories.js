import React, { Component } from 'react';
import Table from 'react-bootstrap/Table';
import PropTypes from 'prop-types';
import PieChart from 'react-minimal-pie-chart';


class Categories extends Component {
  
  render() {
    const titles = {
      aria: "ARIA",
      color: "colors",
      forms: "forms",
      keyboard: "keyboard",
      language: "language",
      'name-role-value': "name/role/value",
      parsing: "parsing",
      semantics: "semantics",
      'sensory-and-visual-cues': "sensory cues",
      structure: "structure",
      tables: "tables",
      'text-alternatives': "text alternatives",
      'time-and-media': "time and media",
    };
    const categories = this.props.categories;
    let data = Object.keys(categories).map(
      name => ({
        name: titles[name] ? titles[name] : name.replace(/-/g, ' '),
        count: categories[name],
      }));
    const total = data.reduce((sum, cat) => sum + cat.count, 0);
    if (data.length < 2)
      return null;
    let otherCount = 0;
    data = data.filter(cat => {
      if (cat.count / total < 0.08) {
        otherCount += cat.count;
        return false;
      }
      return true;
    });
    data = data.sort((c1, c2) => c2.count - c1.count);
    if (otherCount > 0) {
      data.push({
        name: "other",
        count: otherCount,
      });
    }
    const colors = [
      '#b30000',
      '#ff6600',
      '#ffcc66',
      '#ffff80',
      '#99ff66',
      '#33cc33',
      '#009933',
      '#006600',
      '#009973',
      '#33cccc',
      '#80dfff',
      '#6699ff',
      '#9933ff',
      '#cc0099',
    ];
    return (
      <section>
        <h3>Categories</h3>
        <div style={{ display:'flex', flexWrap:'wrap-reverse' }}>
          <Table bordered size="sm" className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th className="text-right">Violations</th>
              </tr>
            </thead>
            <tbody>
              {data.map(
                cat => <tr key={cat.name}>
                  <td>{cat.name}</td>
                  <td>{cat.count}</td>
                </tr>
              )}
            </tbody>
          </Table>
          <PieChart
            style={{ 'width':'580px', 'height':'270px' }}
            data={data.map(
              (cat, index) => ({
                title: cat.name,
                value: Math.round(100 * cat.count / total),
                color: colors[index],
              })
            )}
            startAngle={270}
            label={({ data, dataIndex }) =>
              data[dataIndex].title + ": " + data[dataIndex].value + "%"}
            labelStyle={{
              fontSize: '5px',
              fontFamily: 'sans-serif',
              fill: 'black',
            }}
            radius={35}
            labelPosition={110}
            aria-hidden="true"
            injectSvg={() =>
              <desc>Pie chart of violation categories</desc>
            }
          />
        </div>
      </section>
    );
  }
  
}

Categories.propTypes = {
  categories: PropTypes.object.isRequired,
};

export default Categories;
