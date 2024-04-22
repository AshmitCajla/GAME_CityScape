import * as THREE from 'three';
import { BuildingType } from './buildings/buildingType.js';
import { createBuilding } from './buildings/buildingFactory.js';
import { Tile } from './tile.js';
import { VehicleGraph } from './vehicles/vehicleGraph.js';
import { SimService } from './services/simService.js';
import { updateFundsUI } from '../ui.js';

window.globalAmount = 1000;

export class City extends THREE.Group {
  /**
   * Separate group for organizing debug meshes so they aren't included
   * in raycasting checks
   * @type {THREE.Group}
   */
  debugMeshes = new THREE.Group();
  /**
   * Root node for all scene objects 
   * @type {THREE.Group}
   */
  root = new THREE.Group();
  /**
   * List of services for the city
   * @type {SimService}
   */
  services = [];
  /**
   * The size of the city in tiles
   * @type {number}
   */
  size = 25;
  /**
   * The current simulation time
   */
  simTime = 0;
  /**
   * 2D array of tiles that make up the city
   * @type {Tile[][]}
   */
  tiles = [];
  /**
   * 
   * @param {VehicleGraph} size 
   */
  vehicleGraph;

  constructor(size, name = 'GLS CITYSCAPE') {
    super();

    this.name = name;
    this.size = size;
    
    this.add(this.debugMeshes);
    this.add(this.root);

    this.tiles = [];
    for (let x = 0; x < this.size; x++) {
      const column = [];
      for (let y = 0; y < this.size; y++) {
        const tile = new Tile(x, y);
        tile.refreshView(this);
        this.root.add(tile);
        column.push(tile);
      }
      this.tiles.push(column);
    }

    this.services = [];
    
    this.vehicleGraph = new VehicleGraph(this.size);
    this.debugMeshes.add(this.vehicleGraph);
  }

  /**
   * The total population of the city
   * @type {number}
   */
  get population() {
    let population = 0;
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        const tile = this.getTile(x, y);
        population += tile.building?.residents?.count ?? 0;
      }
    }
    return population;
  }

  /** Returns the title at the coordinates. If the coordinates
   * are out of bounds, then `null` is returned.
   * @param {number} x The x-coordinate of the tile
   * @param {number} y The y-coordinate of the tile
   * @returns {Tile | null}
   */
  getTile(x, y) {
    if (x === undefined || y === undefined ||
      x < 0 || y < 0 ||
      x >= this.size || y >= this.size) {
      return null;
    } else {
      return this.tiles[x][y];
    }
  }

  /**
   * Step the simulation forward by one step
   * @type {number} steps Number of steps to simulate forward in time
   */
  simulate(steps = 1) {
    let count = 0;
    while (count++ < steps) {
      // Update services
      this.services.forEach((service) => service.simulate(this));

      // Update each building
      for (let x = 0; x < this.size; x++) {
        for (let y = 0; y < this.size; y++) {
          this.getTile(x, y).simulate(this);
        }
      }
    }
    this.simTime++;
  }

  bulldoze(x, y) {
    const tile = this.getTile(x, y);

    if (tile.building) {
      if (tile.building.type === BuildingType.road) {
        this.vehicleGraph.updateTile(x, y, null);
      }

      tile.building.dispose();
      tile.setBuilding(null);
      tile.refreshView(this);

      // Update neighboring tiles in case they need to change their mesh (e.g. roads)
      this.getTile(x - 1, y)?.refreshView(this);
      this.getTile(x + 1, y)?.refreshView(this);
      this.getTile(x, y - 1)?.refreshView(this);
      this.getTile(x, y + 1)?.refreshView(this);
    }
  }

  draw() {
    this.vehicleGraph.updateVehicles();
  }

  findTile(start, filter, maxDistance) {
    const startTile = this.getTile(start.x, start.y);
    const visited = new Set();
    const tilesToSearch = [];

    // Initialze our search with the starting tile
    tilesToSearch.push(startTile);

    while (tilesToSearch.length > 0) {
      const tile = tilesToSearch.shift();

      // Has this tile been visited? If so, ignore it and move on
      if (visited.has(tile.id)) {
        continue;
      } else {
        visited.add(tile.id);
      }

      // Check if tile is outside the search bounds
      const distance = startTile.distanceTo(tile);
      if (distance > maxDistance) continue;

      // Add this tiles neighbor's to the search list
      tilesToSearch.push(...this.getTileNeighbors(tile.x, tile.y));

      // If this tile passes the criteria 
      if (filter(tile)) {
        return tile;
      }
    }

    return null;
  }

  /**
   * Finds and returns the neighbors of this tile
   * @param {number} x The x-coordinate of the tile
   * @param {number} y The y-coordinate of the tile
   */
  getTileNeighbors(x, y) {
    const neighbors = [];

    if (x > 0) {
      neighbors.push(this.getTile(x - 1, y));
    }
    if (x < this.size - 1) {
      neighbors.push(this.getTile(x + 1, y));
    }
    if (y > 0) {
      neighbors.push(this.getTile(x, y - 1));
    }
    if (y < this.size - 1) {
      neighbors.push(this.getTile(x, y + 1));
    }

    return neighbors;
  }
}