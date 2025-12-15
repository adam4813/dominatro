/**
 * Core game type definitions for Dominatro
 */
import type * as THREE from 'three';
import type { Domino } from '../game/Domino';

/** Standard domino tile types */
export type DominoType =
  | 'standard'
  | 'wild'
  | 'doubler'
  | 'odd-favor'
  | 'spinner'
  | 'crusher'
  | 'cheater'
  | 'thief'
  | 'blank-slate';

/** Special tile pip value constant - indicates tile should show symbol instead of pips */
export const SPECIAL_TILE_PIP_VALUE = -1;

/** Tile types that act as wildcards for matching */
export const WILDCARD_TYPES: readonly DominoType[] = [
  'wild',
  'crusher',
  'cheater',
  'spinner',
] as const;

/** Check if a domino type is a wildcard */
export function isWildcardType(type: DominoType): boolean {
  return WILDCARD_TYPES.includes(type);
}

/** Represents a domino tile with left and right pip values */
export interface DominoData {
  left: number;
  right: number;
  type: DominoType;
}

/** Represents the open ends of the board chain */
export interface OpenEnds {
  left: number | null;
  right: number | null;
}

/** Valid placement sides on the board */
export type PlacementSide = 'left' | 'right' | 'center';

/** Represents a rack domino with its visual and data components */
export interface RackDomino {
  domino: Domino;
  mesh: THREE.Group;
  data: DominoData;
}

/** Represents a placement zone on the board */
export interface PlacementZone {
  mesh: THREE.Mesh;
  side: PlacementSide;
  isValid: boolean;
  onClickCallback: ((side: PlacementSide, isValid: boolean) => void) | null;
}

/** Ghost domino preview for placement */
export interface GhostDomino {
  domino: Domino;
  mesh: THREE.Group;
}

/** 2D position for pip layout */
export interface PipPosition {
  x: number;
  y: number;
}

/** Canvas context wrapper for HUD rendering */
export interface CanvasContext {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
}

/** HUD canvas collection */
export interface HUDCanvases {
  score?: CanvasContext;
  progression?: CanvasContext;
  bonePile?: CanvasContext;
  rack?: CanvasContext;
}

/** Callback types for scene interactions */
export type DominoSelectedCallback = (dominoData: DominoData) => void;
export type DominoDeselectedCallback = () => void;
export type CanFlipDominoCallback = (dominoData: DominoData) => boolean;
export type GetPlacementOrientationCallback = (
  dominoData: DominoData,
  side: PlacementSide
) => DominoData;
export type PlacementZoneClickCallback = (
  side: PlacementSide,
  isValid: boolean
) => void;
