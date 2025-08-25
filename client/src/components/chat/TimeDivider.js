import React from 'react';
import { format } from 'date-fns';

const TimeDivider = ({ time }) => (
  <div className="my-2 text-center">
    <span className="text-xs text-gray-400">{format(new Date(time), 'h:mm a')}</span>
  </div>
);

export default TimeDivider;

