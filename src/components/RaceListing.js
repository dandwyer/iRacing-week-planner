import React, { Component, PropTypes } from 'react';
import classnames from 'classnames';
import moment from 'moment';
import { clone, intersection } from 'lodash';

import allRaces from '../lib/races';
import filterRaces from '../lib/filterRaces';
import LicenceLevel from './LicenceLevel';
import SeriesModal from './modal/SeriesModal';

import './styles/raceListing.scss';

const sortRaces = (rules, unordered) => {
  const races = clone(unordered);
  races.sort((a, b) => {
    for (const rule of rules) {
      if (a[rule.key] === b[rule.key]) {
        continue;
      }
      if (rule.order === 'asc') {
        return a[rule.key] < b[rule.key] ? -1 : 1;
      }
      if (rule.order === 'desc') {
        return a[rule.key] > b[rule.key] ? -1 : 1;
      }
    }
    return 0;
  });
  return races;
};

export default class RaceListing extends Component {
  static propTypes = {
    time: PropTypes.number,
    sort: PropTypes.array,
    filters: PropTypes.object,
    favouriteSeries: PropTypes.array,
    ownedTracks: PropTypes.array,
    ownedCars: PropTypes.array,
    favouriteCars: PropTypes.array,
    favouriteTracks: PropTypes.array
  }

  static contextTypes = {
    renderModal: PropTypes.func,
    closeModal: PropTypes.func
  }

  static defaultProps = {
    time: Math.round(moment().format('X')),
    sort: [{key: 'licenceLevel', order: 'asc'}, {key: 'series', order: 'asc'}],
    filters: [],
    favouriteSeries: [],
    ownedTracks: [],
    ownedCars: [],
    favouriteCars: [],
    favouriteTracks: []
  }

  constructor(props) {
    super(props);
    this.state = {seriesModalId: null};
  }

  showSeriesModal(seriesId) {
    const { renderModal, closeModal } = this.context;
    const { ownedTracks } = this.props;
    renderModal(
      <SeriesModal onClose={closeModal} ownedTracks={ownedTracks} seriesId={seriesId} />
    );
  }

  render() {
    const { time, sort, filters, favouriteSeries, ownedTracks, ownedCars,
      favouriteCars, favouriteTracks } = this.props;
    const { seriesModalId } = this.state;
    let races = allRaces.filter((race) => {
      return race.startTime < (time * 1000) && (time * 1000) < (race.startTime + race.weekLength);
    });

    races = sortRaces(sort, races);

    races = filterRaces({
      races, filters, ownedTracks, ownedCars, favouriteSeries, favouriteCars, favouriteTracks
    });

    if (filters.favouriteSeries && races.length === 0) {
      return <p>No races this week match your favourite series. Try turning the filter off or adding some.</p>;
    }

    if (filters.favouriteCarsOnly && races.length === 0) {
      return <p>No races this week match your favourite cars. Try turning the filter off or adding some.</p>;
    }

    if (filters.favouriteTracksOnly && races.length === 0) {
      return <p>No races this week match your favourite tracks. Try turning the filter off or adding some.</p>;
    }

    return (
      <div className='table-responsive race-listing'>
        <table className='table' style={{fontSize: '0.8em'}}>
          <thead>
            <tr>
              <th>Class</th>
              <th>Licence</th>
              <th>Type</th>
              <th>Series</th>
              <th>Track</th>
              <th>Car</th>
              <th>Start</th>
              <th>End</th>
              <th>Official</th>
              <th>Fixed</th>
            </tr>
          </thead>
          <tbody>
            {races.map((race, index) => (
              <tr key={index}>
                <td><LicenceLevel effective licence={race.licenceLevel} /></td>
                <td><LicenceLevel licence={race.licenceLevel} /></td>
                <td>{race.type}</td>
                <td className='series' onClick={this.showSeriesModal.bind(this, race.seriesId)}>
                  {favouriteSeries.indexOf(race.seriesId) !== -1 ? (
                    <span className='glyphicon glyphicon-star' />
                  ) : null}
                  <span> </span>{race.series}
                </td>
                <td className={classnames({success: ownedTracks.indexOf(race.trackId) !== -1})}>
                  {favouriteTracks.indexOf(race.trackId) !== -1 ? (
                    <span className='glyphicon glyphicon-star' />
                  ) : null}<span> </span>
                  {race.track}
                </td>
                <td className={classnames({success: intersection(ownedCars, race.carIds).length !== 0})}>
                  {intersection(favouriteCars, race.carIds).length !== 0 ? (
                    <span className='glyphicon glyphicon-star' />
                  ) : null}<span> </span>
                  {race.carClasses.join(', ')}
                </td>
                <td>{moment(race.startTime, 'x').format('YYYY-MM-DD')}</td>
                <td>{
                  moment(race.startTime + race.weekLength, 'x').subtract(1, 'days').format('YYYY-MM-DD')
                }</td>
                <td>{race.official && <span className='glyphicon glyphicon-ok' />}</td>
                <td>{race.fixed && <span className='glyphicon glyphicon-ok' />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
