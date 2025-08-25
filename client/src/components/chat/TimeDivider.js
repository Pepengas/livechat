import React from 'react';
import { format } from 'date-fns';

const TimeDivider = ({ time }) => (
  <div className="time-divider">
    <span>{format(new Date(time), 'h:mm a')}</span>
  </div>
);

export default TimeDivider;

