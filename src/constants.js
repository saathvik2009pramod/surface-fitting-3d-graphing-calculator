/* constants.js — App-wide constants: colour palette and function presets */

const COLORS = [
  '#e06c75', // red
  '#61afef', // blue
  '#98c379', // green
  '#e5c07b', // yellow
  '#c678dd', // purple
  '#56b6c2', // cyan
  '#d19a66', // orange
  '#abb2bf', // grey
];

const PRESETS = [
  { label: 'sin·cos',    expr: 'sin(x) * cos(y)' },
  { label: 'ripple',     expr: 'sin(sqrt(x^2 + y^2))' },
  { label: 'saddle',     expr: 'x^2 - y^2' },
  { label: 'paraboloid', expr: '(x^2 + y^2) / 4' },
  { label: 'crater',     expr: '-(x^2 + y^2) + 4' },
  { label: 'egg carton', expr: 'sin(x) + cos(y)' },
  { label: 'twisted',    expr: 'sin(x * y)' },
  { label: 'Mexican hat',expr: '(1 - (x^2 + y^2)) * e^(-(x^2 + y^2) / 2)' },
];
