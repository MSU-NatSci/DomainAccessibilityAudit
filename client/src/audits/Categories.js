import React, { Component } from 'react';
import Table from 'react-bootstrap/Table';
import PropTypes from 'prop-types';
import { PieChart } from 'react-minimal-pie-chart';


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
    
    // create the "other" category
    // we don't want a category with less than 7%,
    // we want other to be either 0 or at least 6%,
    // unless that would require using categories with 12% or more
    let otherCount = 0;
    let threshold = 0.07;
    const targetOtherCount = 0.06;
    const maxThreshold = 0.12;
    const moveToOther = {};
    do {
      for (const cat of data) {
        if (moveToOther[cat.name] === 1)
          break;
        if (cat.count / total < threshold) {
          moveToOther[cat.name] = 1;
          otherCount += cat.count;
        }
      }
      threshold += 0.01;
    } while (otherCount > 0 && otherCount / total < targetOtherCount &&
      threshold < maxThreshold);
    data = data.filter(cat => moveToOther[cat.name] !== 1);
    
    data = data.sort((c1, c2) => c2.count - c1.count);
    if (Math.round(100 * otherCount / total) > 0) {
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
        <h2>Categories</h2>
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
            viewBoxSize={[580, 270]}
            style={{ 'width':'580px', 'height':'270px' }}
            data={data.map(
              (cat, index) => ({
                title: cat.name,
                value: Math.round(100 * cat.count / total),
                color: colors[index],
              })
            )}
            startAngle={270}
            label={({ dataEntry }) =>
              dataEntry.title + ": " + dataEntry.value + "%"}
            labelStyle={{
              fontSize: '13px',
              fontFamily: 'sans-serif',
              fill: 'black',
            }}
            radius={100}
            center={[290,135]}
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
