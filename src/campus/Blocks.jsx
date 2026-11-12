import React from 'react';
import Building from './Building';
import { BUILDINGS } from './config';

const make = (id) => function Block(props) { return <Building cfg={BUILDINGS[id]} {...props} />; };
export { default as AdminBlock } from './AdminBlock';
export const ABlock = make('a');
export const BBlock = make('b');
export const CBlock = make('c');
export const Canteen = make('canteen');
export const GirlsHostel = make('girls');
export const BoysHostel = make('boys');
