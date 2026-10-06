import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

// Renders the given icon component, or a warning icon if none was passed.
const SafeIcon = ({ icon, ...props }) =>
  icon ? React.createElement(icon, props) : <FiAlertTriangle {...props} />;

export default SafeIcon;
