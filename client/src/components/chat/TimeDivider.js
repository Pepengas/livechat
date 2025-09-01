import React from 'react';
import { format } from 'date-fns';

const TimeDivider = ({ time }) => (
  <div className="time-divider">
    <hr />
    <span>{format(new Date(time), 'h:mm a')}</span>
    <hr />
  </div>
);

export default TimeDivider;

