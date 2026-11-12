import React from 'react';
import { ABlock, AdminBlock, BBlock, BoysHostel, Canteen, CBlock, GirlsHostel } from './Blocks';
import Auditorium from './Auditorium';
import Temple from './Temple';
import OpenAuditorium from './OpenAuditorium';
import MechanicalLab from './MechanicalLab';
import MainEntrance from './MainEntrance';
import { BadmintonCourt, CricketGround, KabaddiCourt, VolleyballCourt } from './Sports';
import { ENTRANCE, GATE2 } from './config';
import { BoundaryWall, CampusGround, InternalRoads, ParkingAndVehicles, TreesAndLandscaping } from './Environment';
import Students from './Students';

export const STRUCTURES = [
  ['admin', AdminBlock], ['a', ABlock], ['b', BBlock], ['c', CBlock], ['temple', Temple], ['canteen', Canteen],
  ['openAuditorium', OpenAuditorium], ['auditorium', Auditorium], ['girls', GirlsHostel], ['boys', BoysHostel],
  ['mechlab', MechanicalLab],
  ['cricket', CricketGround], ['volleyball', VolleyballCourt], ['badminton', BadmintonCourt], ['kabaddi', KabaddiCourt],
];

/** Everything that lives inside the <Canvas>. Self-contained: no app state, no external styles. */
export default function CampusModel({ selectedId = null, onSelect, onHover, statuses = {}, showLabels = true }) {
  return (
    <group name="rcee-campus">
      <CampusGround />
      <InternalRoads />
      <BoundaryWall />
      <MainEntrance position={[ENTRANCE.x, 0, ENTRANCE.z]} rotationY={ENTRANCE.rotationY} halfSpan={ENTRANCE.halfSpan} scale={ENTRANCE.scale} showSign={true} />
      <MainEntrance position={[GATE2.x, 0, GATE2.z]} rotationY={GATE2.rotationY} halfSpan={GATE2.halfSpan} scale={GATE2.scale} showSign={false} />
      {STRUCTURES.map(([id, C]) => (
        <C key={id} status={statuses[id]} selected={selectedId === id} onSelect={onSelect} onHover={onHover} showLabel={showLabels} />
      ))}
      <TreesAndLandscaping />
      <ParkingAndVehicles />
      <Students />
    </group>
  );
}
